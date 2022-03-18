import core from '@actions/core';
import { createHash } from 'crypto';
import fs from 'fs';
import { promisify } from 'util';
import type { RssFeed, RssFeedItem } from '../types.d';

const read = promisify(fs.readFile);
const write = promisify(fs.writeFile);
const md = promisify(fs.mkdir);

// Defines a CacheRecord, which is used to check if an item has already been published
class CacheRecord {
  [index: string]: string | number | undefined;
  feedTitle?: string; // title of the rss feed
  title?: string; // title of the post
  date?: string | number; // publish date of the post

  constructor(feedTitle?: string, title?: string, date?: number | string) {
    this.feedTitle = feedTitle;
    this.title = title;
    this.date = date;
  }
}

// For hashing the CacheRecord
const hash = (str: string): string => {
  return createHash('sha256').update(str).digest('hex');
};

// Generates a hashable string from the CacheRecord
const cacheSlug = (item: CacheRecord): string => {
  const { feedTitle, title, created } = item;

  let slug = '';
  slug += feedTitle?.toLowerCase().replace(/[^a-z0-9]/g, '-');
  slug += title?.toLowerCase().replace(/[^a-z0-9]/g, '-');

  if (created) {
    const date = new Date(created);
    slug += `${slug}-${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }
  return slug;
};

// Reads the cache file and returns it as an array of hashes
const readCache = async (rssFeed: string, cacheDir: string): Promise<string[]> => {
  try {
    core.debug(`Retrieving previously published entries…`);

    const rssFeedUrl = new URL(rssFeed);
    const cachePath = `${cacheDir}/${rssFeedUrl.hostname.replace(/\./g, '_')}.json`;
    const cached = JSON.parse(await read(cachePath, 'utf8'));

    core.debug(`Found ${cached.length} cached items`);
    return cached;
  } catch (err) {
    core.debug((<Error>err).message);
    throw new Error('Failed to read cache');
  }
};

// Checks if an item has already been published by comparing hashed CacheRecords
const checkCache = async (rss: RssFeed, cached: string[]): Promise<RssFeedItem[]> => {
  try {
    if (rss?.items) {
      const output = [];
      // For each item in the RSS feed
      for (const item of rss.items) {
        let cacheHit = false;

        // Compare the item to the cached items
        for (const published in cached) {
          const record = new CacheRecord(rss.title, item.title, item.created);

          if (cached[published] === hash(cacheSlug(record))) {
            cacheHit = true;
            core.debug(`Cache hit for ${item.title}`);
          }
        }

        if (!cacheHit) output.push(item);
      }

      core.debug(`Found ${output.length} new items`);
      return output;
    } else {
      core.debug('Nothing to check');
      return [];
    }
  } catch (err) {
    core.debug((<Error>err).message);
    throw new Error('Error checking cache');
  }
};

// Writes the cached entries back to the disk for future use
const writeCache = async (
  feedTitle: string,
  rssFeed: string,
  cacheDir: string,
  filtered: RssFeedItem[],
  cached: string[]
): Promise<void> => {
  try {
    const rssFeedUrl = new URL(rssFeed);
    const cachePath = `${cacheDir}/${rssFeedUrl.hostname.replace(/\./g, '_')}.json`;

    core.debug(`Writing cache to ${cachePath}`);

    await md(cacheDir, { recursive: true });

    const hashed = [...cached];
    for (const sent of filtered) {
      const record = new CacheRecord(feedTitle, sent.title, sent.created);
      hashed.push(hash(cacheSlug(record)));
    }

    await write(cachePath, JSON.stringify(hashed));
  } catch (err) {
    core.debug((<Error>err).message);
    throw new Error('Failed to write to cache');
  }
};

export { readCache, checkCache, writeCache, CacheRecord };
