import core from '@actions/core';
import { writeCache } from './lib/cache';
import { getFeed } from './lib/getfeed.js';
import { genPayload } from './lib/payload';
import { slack } from './lib/slack.js';
import { validate } from './lib/validate.js';

const { debug, info, setFailed, getInput, getBooleanInput } = core;

const run = async () => {
  try {
    // validate inputs
    validate();

    // parse inputs
    const slackWebhook = getInput('slack_webhook');
    const rssFeed = getInput('rss');
    const cacheDir = getInput('cache_dir');
    const interval = getInput('interval');
    let unfurl = false;
    try {
      unfurl = getBooleanInput('unfurl');
    } catch (err) {
      debug(err.message);
    }

    // get rss feed items
    const { filtered, unfiltered, cached } = await getFeed(rssFeed, cacheDir, interval);

    if (filtered.length) {
      // generate payload
      const payload = await genPayload(filtered, unfiltered, rssFeed, unfurl);

      // send payload to slack
      await slack(payload, slackWebhook);

      // cache data
      if (cacheDir) await writeCache(rssFeed, cacheDir, filtered, cached);
    } else {
      info(`No new items found`);
    }
  } catch (err) {
    debug('Operation failed due to error');
    setFailed(err.message);
  }
};

(async () => {
  await run();
})();
