import core from '@actions/core';
import dayjs from 'dayjs';
import parse from 'rss-to-json';
import { checkCache, readCache } from './cache.js';

const getFeed = async (rssFeed, cacheDir, interval) => {
  core.debug(`Retrieving ${rssFeed}…`);
  const rss = await parse(rssFeed);
  core.debug(`Feed has ${rss.items.length} items`);

  if (rss?.items?.length) {
    let toSend = [];
    let cached = [];
    if (cacheDir) {
      core.debug(`Retrieving previously cached entries…`);
      try {
        cached = await readCache(rssFeed, cacheDir);
        toSend = await checkCache(rss, cached);
      } catch (err) {
        core.debug(err.message);
        toSend = rss.items.filter(item => {
          return dayjs(item.created).isAfter(dayjs().subtract(60, 'minute'));
        });
      }
    } else {
      core.debug(`Selecting items posted in the last ${interval} minutes…`);
      toSend = rss.items.filter(item => {
        return dayjs(item.created).isAfter(dayjs().subtract(interval, 'minute'));
      });
    }

    return { filtered: toSend, unfiltered: rss, cached: cached };
  } else {
    throw new Error('No feed items found');
  }
};

export { getFeed };
