import core from '@actions/core';
import { writeCache } from './lib/cache';
import { getFeed } from './lib/getfeed';
import { genPayload } from './lib/payload';
import { slack } from './lib/slack';
import { validate } from './lib/validate';

const run = async () => {
  try {
    // validate inputs
    validate();

    // parse inputs
    const slackWebhook = core.getInput('slack_webhook');
    const rssFeed = core.getInput('rss');
    const cacheDir = core.getInput('cache_dir');
    const interval = core.getInput('interval') ? parseInt(core.getInput('interval')) : undefined;
    let unfurl = false;
    try {
      unfurl = core.getBooleanInput('unfurl');
    } catch (err) {
      core.debug((<Error>err).message);
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
      core.info(`No new items found`);
    }
  } catch (err) {
    core.debug('Operation failed due to error');
    core.setFailed((<Error>err).message);
  }
};

(async () => {
  await run();
})();
