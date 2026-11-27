import * as core from "@actions/core";
import dayjs from "dayjs";
import Parser from "rss-parser";
import type { RssFeed, RssFeedItem } from "../types.ts";
import { checkCache, readCache } from "./cache.ts";

const FEED_TIMEOUT_MS = 10_000;

const parser = new Parser({
  customFields: {
    item: ["content:encoded"],
  },
});

// Fetches the feed text with our own timeout and UA handling; parseString
// keeps rss-parser out of its legacy url.parse code path.
const fetchFeed = async (
  rssFeed: string,
  timeoutMs: number
): Promise<string> => {
  const res = await fetch(rssFeed, {
    headers: { "User-Agent": "slackfeedbot" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`Feed request failed: ${res.status}`);
  }
  return res.text();
};

const toTimestamp = (item: Parser.Item): number => {
  const parsed = Date.parse(item.isoDate ?? item.pubDate ?? "");
  return Number.isNaN(parsed) ? Date.now() : parsed;
};

// Prefers the full HTML body, then any description variants
const toHtml = (item: Parser.Item): string | undefined => {
  const record = item as unknown as Record<string, string | undefined>;
  return (
    record["content:encoded"] ??
    item.content ??
    record.description ??
    record.contentSnippet
  );
};

// Extracts a usable post image: iTunes art first, then image enclosures
const toImage = (item: Parser.Item): string | undefined => {
  const { itunes } = item as unknown as { itunes?: { image?: string } };
  if (itunes?.image) {
    return itunes.image;
  }
  const { enclosure } = item;
  if (enclosure?.url && (enclosure.type ?? "").startsWith("image/")) {
    return enclosure.url;
  }
  return undefined;
};

const toItem = (item: Parser.Item): RssFeedItem => ({
  title: item.title,
  description: toHtml(item),
  link: item.link,
  image: toImage(item),
  published: toTimestamp(item),
  created: toTimestamp(item),
  category: item.categories ?? [],
});

const toFeed = (feed: Parser.Output<Parser.Item>): RssFeed => ({
  title: feed.title,
  description: feed.description,
  link: feed.link,
  image: feed.image?.url,
  category: (feed as unknown as { category?: string[] }).category ?? [],
  items: feed.items.map(toItem),
});

// Gets the feed, checks the cache (or time since last run), and returns new items
const getFeed = async (
  rssFeed: string,
  cacheDir: string | undefined,
  interval: number | undefined,
  timeoutMs: number = FEED_TIMEOUT_MS
): Promise<{
  filtered: RssFeedItem[];
  unfiltered: RssFeed;
  cached: string[];
}> => {
  core.debug(`Retrieving ${rssFeed}…`);

  const rss = toFeed(
    await parser.parseString(await fetchFeed(rssFeed, timeoutMs))
  );
  core.debug(`Feed has ${rss.items?.length} items`);

  if (rss.items?.length) {
    let toSend: RssFeedItem[] = [];
    let cached: string[] = [];

    if (cacheDir) {
      core.debug("Retrieving previously cached entries…");

      try {
        cached = await readCache(rssFeed, cacheDir);
        toSend = (await checkCache(rss, cached)).filter((item) =>
          dayjs(item.created).isAfter(dayjs().subtract(1, "hour"))
        );
      } catch (err) {
        core.debug(err instanceof Error ? err.message : String(err));

        toSend = rss.items.filter((item) =>
          dayjs(item.created).isAfter(dayjs().subtract(1, "hour"))
        );
      }
    } else if (interval) {
      core.debug(`Selecting items posted in the last ${interval} minutes…`);

      toSend = rss.items.filter((item) =>
        dayjs(item.created).isAfter(dayjs().subtract(interval, "minute"))
      );
    }

    return { filtered: toSend, unfiltered: rss, cached };
  }

  core.info("No feed items found");
  return { filtered: [], unfiltered: rss, cached: [] };
};

export { getFeed };
