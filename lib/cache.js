import core from '@actions/core';
import fs from 'fs';
import { promisify } from 'util';
import { digest, hashable } from '../node_modules/object-sha/dist/esm/index.node';

const read = promisify(fs.readFile);
const write = promisify(fs.writeFile);
const md = promisify(fs.mkdir);

const hash = async obj => {
  const toHash = hashable(obj);
  const hashed = await digest(toHash);
  return hashed;
};

const readCache = async (rssFeed, cacheDir) => {
  try {
    core.debug(`Retrieving previously published entries…`);

    const rssFeedUrl = new URL(rssFeed);
    const cachePath = `${cacheDir}/${rssFeedUrl.hostname.replace(/\./g, '_')}.json`;
    const cached = JSON.parse(await read(cachePath, 'utf8'));

    core.debug(`Found ${cached.length} cached items`);
    return cached;
  } catch (err) {
    core.debug(err.message);
    return [];
  }
};

const checkCache = async (rss, cached) => {
  try {
    const output = [];

    for (const item in rss.items) {
      let cacheHit = false;

      for (const published in cached) {
        if (published === (await hash({ title: item.title, date: item.created }))) {
          cacheHit = true;
          core.debug(`Cache hit for ${item.title}`);
        }
      }

      if (!cacheHit) output.push(item);
    }

    core.debug(`Found ${output.length} new items`);
    return output;
  } catch (err) {
    core.debug(err.message);
    throw new Error('Error checking cache');
  }
};

const writeCache = async (rssFeed, cacheDir, filtered, cached) => {
  try {
    const rssFeedUrl = new URL(rssFeed);
    const cachePath = `${cacheDir}/${rssFeedUrl.hostname.replace(/\./g, '_')}.json`;

    core.debug(`Writing cache to ${cachePath}`);

    await md(cacheDir, { recursive: true });

    const hashed = [...cached];
    for (const sent of filtered) {
      hashed.push(await hash({ title: sent.title, date: sent.created }));
    }

    await write(cachePath, JSON.stringify(hashed));
  } catch (err) {
    core.debug(err.message);
    throw new Error('Failed to write to cache');
  }
};

export { readCache, checkCache, writeCache };
