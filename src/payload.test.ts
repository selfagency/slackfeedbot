import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { genPayload } from "./lib/payload.ts";
import type { RssFeed, RssFeedItem } from "./types.ts";

const FEED = "https://example.com/feed.xml";
const FEED_IMAGE = "https://example.com/icon.png";
const TS = Date.parse("2026-01-02T03:04:05Z");

const feed = (items: RssFeedItem[]): RssFeed => ({
  title: "Test Feed",
  link: "https://example.com",
  items,
});

const item = (overrides: Partial<RssFeedItem>): RssFeedItem => ({
  title: "A title",
  link: "https://example.com/post-1",
  description: "<p>Body <b>bold</b> <em>em</em></p>",
  created: TS,
  image: FEED_IMAGE,
  ...overrides,
});

interface GenOptions {
  feedImg: string;
  feedName: string;
  showDate: boolean;
  showDesc: boolean;
  showImg: boolean;
  showLink: boolean;
  unfurl: boolean;
}

const gen = (
  items: RssFeedItem[],
  overrides?: Partial<GenOptions>
): Promise<PayloadShape> => {
  const opts: GenOptions = {
    feedName: "",
    feedImg: FEED_IMAGE,
    unfurl: false,
    showDesc: true,
    showImg: true,
    showDate: true,
    showLink: true,
    ...overrides,
  };
  return genPayload(
    items,
    feed(items),
    FEED,
    opts.feedName,
    opts.feedImg,
    opts.unfurl,
    opts.showDesc,
    opts.showImg,
    opts.showDate,
    opts.showLink
  );
};

type PayloadShape = Awaited<ReturnType<typeof genPayload>>;

describe("genPayload", () => {
  it("builds header, styled section, image accessory, and date context", async () => {
    const payload = await gen([item({})]);
    expect(payload.blocks).toHaveLength(3);

    expect(payload.blocks[0]).toEqual({
      type: "header",
      text: { type: "plain_text", text: "A title" },
    });

    const [, section] = payload.blocks;
    expect(section.type).toBe("section");
    expect(section.text?.type).toBe("mrkdwn");
    expect(section.text?.text).toBe("Body *bold* _em_");
    expect(section.accessory?.image_url).toBe(FEED_IMAGE);

    expect(payload.blocks[2].type).toBe("context");
    const contextText = payload.blocks[2].elements?.[0]?.text ?? "";
    expect(contextText).toBe(
      `Published ${dayjs(TS).format("MMM D @ h:mma")} UTC`
    );
  });

  it("respects the show_* flags", async () => {
    // All styling off still emits an (empty) section block; only the header
    // carries content. Pinned as current behavior.
    const payload = await gen([item({})], {
      showDesc: false,
      showImg: false,
      showDate: false,
      showLink: false,
    });

    expect(payload.blocks).toHaveLength(2);
    expect(payload.blocks[0].type).toBe("header");
    expect(payload.blocks[1].type).toBe("section");
    expect(payload.blocks[1].text).toBeUndefined();
    expect(payload.blocks[1].fields).toHaveLength(0);
    expect(payload.blocks[1].accessory).toBeUndefined();
  });

  it("suppresses description text that just repeats the read-more link", async () => {
    const payload = await gen([item({ description: "Read more" })]);

    const [, section] = payload.blocks;
    expect(section.text).toBeUndefined();
  });

  it("unfurl mode renders header + read-more only", async () => {
    const payload = await gen([item({})], { unfurl: true });

    expect(payload.blocks).toHaveLength(2);
    expect(payload.blocks[1].text?.text).toBe(
      "<https://example.com/post-1|Read more>"
    );
    expect(payload.unfurl_links).toBe(true);
    expect(payload.unfurl_media).toBe(true);
  });

  it("falls back to the feed title for the username and feed image for the icon", async () => {
    const payload = await gen([item({})]);
    expect(payload.username).toBe("Test Feed");
    expect(payload.icon_url).toBe(FEED_IMAGE);
  });

  it("honors feed_name and feed_image input overrides", async () => {
    const payload = await gen([item({})], {
      feedName: "My Feed",
      feedImg: "https://override.example/logo.png",
    });

    expect(payload.username).toBe("My Feed");
    expect(payload.icon_url).toBe("https://override.example/logo.png");
  });

  it("converts links, lists, and entities in descriptions to mrkdwn", async () => {
    const payload = await gen([
      item({
        description:
          '<p>See <a href="https://x.dev">the docs</a> &amp; more</p><ul><li>One</li><li>Two</li></ul>',
      }),
    ]);

    const text = payload.blocks[1].text?.text ?? "";
    expect(text).toContain("<https://x.dev|the docs>");
    expect(text).toContain("&");
    expect(text).toContain("• One");
    expect(text).toContain("• Two");
  });
});
