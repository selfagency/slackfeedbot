import { mkdtemp, rm } from "node:fs/promises";
import type { Server } from "node:http";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeCache } from "./lib/cache.ts";
import { getFeed } from "./lib/getfeed.ts";

let server: Server | undefined;
let feedUrl = "";

const itemXml = (parts: {
  title: string;
  link: string;
  iso?: string;
  html?: string;
  image?: string;
  enclosure?: { url: string; type: string } | undefined;
}): string =>
  [
    "<item>",
    `<title>${parts.title}</title>`,
    `<link>${parts.link}</link>`,
    parts.iso === undefined
      ? ""
      : `<pubDate>${new Date(parts.iso).toUTCString()}</pubDate>`,
    parts.html === undefined
      ? ""
      : `<content:encoded><![CDATA[${parts.html}]]></content:encoded>`,
    parts.image === undefined ? "" : `<itunes:image href="${parts.image}"/>`,
    parts.enclosure === undefined
      ? ""
      : `<enclosure url="${parts.enclosure.url}" type="${parts.enclosure.type}"/>`,
    "</item>",
  ].join("");

const feedXml = (items: string[]): string =>
  `<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"><channel><title>Test Feed</title><link>https://example.com</link><description>d</description>${items.join(
    ""
  )}</channel></rss>`;

const startFeed = async (xml: string): Promise<void> => {
  server = createServer((req, res) => {
    if (req.url?.startsWith("/feed")) {
      res.writeHead(200, { "content-type": "application/rss+xml" });
      res.end(xml);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => {
    server?.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  feedUrl = `http://127.0.0.1:${port}/feed`;
};

afterEach(async () => {
  if (server !== undefined) {
    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });
    server = undefined;
  }
});

const NOW = Date.now();
const DAY_AGO = new Date(NOW - 24 * 60 * 60 * 1000).toISOString();

describe("getFeed", () => {
  it("maps feed items (title, link, html body, created ms, images)", async () => {
    const second = new Date(NOW - 1000);
    second.setMilliseconds(0);
    await startFeed(
      feedXml([
        itemXml({
          title: "Post",
          link: "https://x.dev/1",
          iso: second.toISOString(),
          html: "<b>bold</b>",
          image: "https://x.dev/art.png",
        }),
      ])
    );

    const { filtered, unfiltered } = await getFeed(feedUrl, undefined, 15);
    expect(unfiltered.title).toBe("Test Feed");
    expect(filtered).toHaveLength(1);

    const [first] = filtered;
    expect(first.title).toBe("Post");
    expect(first.link).toBe("https://x.dev/1");
    expect(first.description).toBe("<b>bold</b>");
    expect(first.created).toBe(second.getTime());
    expect(first.image).toBe("https://x.dev/art.png");
  });

  it("falls back to image enclosures when iTunes art is absent", async () => {
    const iso = new Date(NOW - 1000).toISOString();
    await startFeed(
      feedXml([
        itemXml({
          title: "E",
          link: "https://x.dev/2",
          iso,
          enclosure: { url: "https://x.dev/cover.jpg", type: "image/jpeg" },
        }),
        itemXml({
          title: "T",
          link: "https://x.dev/3",
          iso,
          enclosure: { url: "https://x.dev/clip.mp3", type: "audio/mpeg" },
        }),
      ])
    );

    const { filtered } = await getFeed(feedUrl, undefined, 15);
    expect(filtered[0].image).toBe("https://x.dev/cover.jpg");
    expect(filtered[1].image).toBeUndefined();
  });

  it("keeps only items newer than the interval", async () => {
    await startFeed(
      feedXml([
        itemXml({
          title: "Recent",
          link: "https://x.dev/r",
          iso: new Date(NOW - 1000).toISOString(),
        }),
        itemXml({ title: "Old", link: "https://x.dev/o", iso: DAY_AGO }),
      ])
    );

    const { filtered } = await getFeed(feedUrl, undefined, 15);
    expect(filtered.map((entry) => entry.title)).toEqual(["Recent"]);
  });

  it("filters via the cache and hides items older than 1 hour", async () => {
    const dir = await mkdtemp(join(tmpdir(), "slackfeedbot-getfeed-"));
    try {
      const recentIso = new Date(NOW - 1000).toISOString();
      const twoHoursAgo = new Date(NOW - 2 * 60 * 60 * 1000).toISOString();
      await startFeed(
        feedXml([
          itemXml({ title: "Cached", link: "https://x.dev/c", iso: recentIso }),
          itemXml({
            title: "Stale",
            link: "https://x.dev/s",
            iso: twoHoursAgo,
          }),
        ])
      );

      await writeCache(
        "Test Feed",
        feedUrl,
        dir,
        [{ title: "Cached", created: Date.parse(recentIso) }],
        []
      );
      const { filtered } = await getFeed(feedUrl, dir, undefined);

      expect(filtered).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("falls back to the 1-hour window when the cache is unreadable", async () => {
    const notADir = join(tmpdir(), "slackfeedbot-not-a-dir");
    await startFeed(
      feedXml([
        itemXml({
          title: "Fresh",
          link: "https://x.dev/f",
          iso: new Date(NOW - 1000).toISOString(),
        }),
      ])
    );

    const { filtered } = await getFeed(feedUrl, notADir, undefined);
    expect(filtered.map((entry) => entry.title)).toEqual(["Fresh"]);
  });

  it("treats an empty feed as a no-op instead of failing", async () => {
    await startFeed(feedXml([]));
    const { filtered, unfiltered } = await getFeed(
      feedUrl,
      undefined,
      undefined
    );
    expect(filtered).toEqual([]);
    expect(unfiltered.items ?? []).toEqual([]);
  });

  it("skips date-less items in cache mode (recency window)", async () => {
    await startFeed(
      feedXml([itemXml({ title: "NoDate", link: "https://x.dev/n" })])
    );
    const dir = await mkdtemp(join(tmpdir(), "slackfeedbot-nodate-"));
    try {
      const { filtered } = await getFeed(feedUrl, dir, undefined);
      expect(filtered).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("skips date-less items in interval mode", async () => {
    await startFeed(
      feedXml([itemXml({ title: "NoDate", link: "https://x.dev/n" })])
    );
    const { filtered } = await getFeed(feedUrl, undefined, 15);
    expect(filtered).toEqual([]);
  });

  it("rejects non-200 feed responses with the status code", async () => {
    server = createServer((_req, res) => {
      res.writeHead(404, { "content-type": "text/plain" });
      res.end("nope");
    });
    await new Promise<void>((resolve) => {
      server?.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    feedUrl = `http://127.0.0.1:${port}/feed`;

    await expect(getFeed(feedUrl, undefined, undefined)).rejects.toThrowError(
      "Feed request failed: 404"
    );
  });

  it("rejects feeds that exceed the timeout", async () => {
    server = createServer(() => {
      // Responds never; the client aborts at timeoutMs.
    });
    await new Promise<void>((resolve) => {
      server?.listen(0, "127.0.0.1", () => resolve());
    });
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    feedUrl = `http://127.0.0.1:${port}/feed`;

    await expect(getFeed(feedUrl, undefined, undefined, 50)).rejects.toThrow();
  });
});
