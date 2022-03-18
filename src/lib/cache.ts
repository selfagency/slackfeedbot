import core from '@actions/core';
import fs from 'fs';
import { promisify } from 'util';
import type { RssFeed, RssFeedItem } from '../types.d';
import digest from './sha';

const read = promisify(fs.readFile);
const write = promisify(fs.writeFile);
const md = promisify(fs.mkdir);

class CacheRecord {
  [index: string]: string | number | undefined;
  title?: string;
  date?: string | number;

  constructor(title?: string, date?: number | string) {
    this.title = title;
    this.date = date;
  }
}

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
    return [];
  }
};

const checkCache = async (rss: RssFeed, cached: string[]): Promise<RssFeedItem[]> => {
  try {
    if (rss?.items) {
      const output = [];
      for (const item of rss.items) {
        let cacheHit = false;

        for (const published in cached) {
          const record = new CacheRecord(item.title, item.created);
          if (published === (await digest(record))) {
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

const writeCache = async (
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
      const record = new CacheRecord(sent.title, sent.created);
      hashed.push(await digest(record));
    }

    await write(cachePath, JSON.stringify(hashed));
  } catch (err) {
    core.debug((<Error>err).message);
    throw new Error('Failed to write to cache');
  }
};

export { readCache, checkCache, writeCache, CacheRecord };
