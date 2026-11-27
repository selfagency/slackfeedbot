import core from "@actions/core";
import dayjs from "dayjs";
import { parse } from "rss-to-json";
import type { RssFeed, RssFeedItem } from "../types.d";
import { checkCache, readCache } from "./cache.ts";

// Gets the feed, checks the cache (or time since last run), and returns new items
const getFeed = async (
  rssFeed: string,
  cacheDir: string | undefined,
  interval: number | undefined
): Promise<{
  filtered: RssFeedItem[];
  unfiltered: RssFeed;
  cached: string[];
}> => {
  core.debug(`Retrieving ${rssFeed}…`);

  const rss: RssFeed = await parse(rssFeed, {});
  core.debug(`Feed has ${rss?.items?.length} items`);

  if (rss?.items?.length) {
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
  throw new Error("No feed items found");
};

export { getFeed };
