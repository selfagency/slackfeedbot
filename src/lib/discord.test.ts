import { describe, expect, it } from "vitest";
import type { RssFeed, RssFeedItem } from "../types.ts";
import { buildDiscordMessages } from "./discord.ts";

const FEED: RssFeed = {
  title: "Test Feed",
  link: "https://example.com",
  items: [],
};

const item = (
  title: string,
  overrides: Partial<RssFeedItem> = {}
): RssFeedItem => ({
  title,
  link: `https://example.com/${title}`,
  description: '<p>Body <a href="https://x.dev">docs</a></p>',
  created: Date.parse("2026-01-02T03:04:05Z"),
  image: "https://example.com/img.png",
  ...overrides,
});

const opts = {
  feedName: "",
  feedImg: "https://example.com/icon.png",
  unfurl: false,
  showDesc: true,
  showImg: true,
  showDate: true,
};

describe("buildDiscordMessages", () => {
  it("maps an item to an embed with username, avatar, and hard mention suppression", () => {
    const [message] = buildDiscordMessages([item("Post")], FEED, opts);

    expect(message.username).toBe("Test Feed");
    expect(message.avatar_url).toBe("https://example.com/icon.png");
    expect(message.allowed_mentions).toEqual({ parse: [] });

    expect(message.embeds).toHaveLength(1);
    const [embed] = message.embeds;
    expect(embed.title).toBe("Post");
    expect(embed.url).toBe("https://example.com/Post");
    expect(embed.timestamp).toBe("2026-01-02T03:04:05.000Z");
    expect(embed.image).toEqual({ url: "https://example.com/img.png" });
    expect(embed.description).toContain("[docs](https://x.dev)");
  });

  it("never renders Slack-style mention control sequences", () => {
    const [message] = buildDiscordMessages(
      [item("x", { description: "<!here> go <@U123> now" })],
      FEED,
      opts
    );

    const rendered = JSON.stringify(message);
    // The Discord mrkdwn flavor emits [label](url) links; mention control
    // sequences never appear, and allowed_mentions is empty.
    expect(rendered).not.toContain("<@U123>");
    expect(rendered).not.toContain("<!here>");
    expect(message.allowed_mentions.parse).toEqual([]);
  });

  it("respects the flags", () => {
    const [message] = buildDiscordMessages([item("Post")], FEED, {
      ...opts,
      showDesc: false,
      showImg: false,
      showDate: false,
    });

    const [embed] = message.embeds;
    expect(embed.description).toBeUndefined();
    expect(embed.image).toBeUndefined();
    expect(embed.timestamp).toBeUndefined();
    expect(embed.title).toBe("Post");
  });

  it("unfurl mode embeds title+url only", () => {
    const [message] = buildDiscordMessages([item("Post")], FEED, {
      ...opts,
      unfurl: true,
    });
    const [embed] = message.embeds;
    expect(embed.description).toBeUndefined();
    expect(embed.image).toBeUndefined();
    expect(embed.timestamp).toBeUndefined();
    expect(embed.title).toBe("Post");
    expect(embed.url).toBe("https://example.com/Post");
  });

  it("chunks messages at 10 embeds", () => {
    const items = Array.from({ length: 12 }, (_, index) => item(`p${index}`));
    const messages = buildDiscordMessages(items, FEED, opts);

    expect(messages).toHaveLength(2);
    expect(messages[0].embeds).toHaveLength(10);
    expect(messages[1].embeds).toHaveLength(2);
  });

  it("chunks before exceeding the 6000-character message limit", () => {
    const longDescription = "x".repeat(3500);
    const items = [item("a"), item("b"), item("c")].map((entry) => ({
      ...entry,
      description: longDescription,
    }));
    const messages = buildDiscordMessages(items, FEED, opts);

    expect(messages).toHaveLength(3);
    for (const message of messages) {
      const total = message.embeds.reduce(
        (sum, embed) => sum + (embed.description?.length ?? 0),
        0
      );
      expect(total).toBeLessThanOrEqual(6000);
    }
  });

  it("clamps titles and descriptions to Discord limits", () => {
    const [message] = buildDiscordMessages(
      [item("T".repeat(300), { description: "d".repeat(5000) })],
      FEED,
      opts
    );

    const [embed] = message.embeds;
    expect(embed.title?.length).toBe(256);
    expect(embed.title?.endsWith("…")).toBe(true);
    expect(embed.description?.length).toBe(4096);
    expect(embed.description?.endsWith("…")).toBe(true);
  });

  it("omits the timestamp for items without a created date", () => {
    const [message] = buildDiscordMessages(
      [item("Post", { created: undefined })],
      FEED,
      opts
    );
    expect(message.embeds[0].timestamp).toBeUndefined();
  });
});
