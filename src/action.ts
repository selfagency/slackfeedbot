import core from '@actions/core';
import { writeCache } from './lib/cache';
import { getFeed } from './lib/getfeed';
import { genPayload } from './lib/payload';
import { slack } from './lib/slack';
import { validate } from './lib/validate';

const run = async () => {
  try {
    // Validate inputs
    validate();

    // Parse inputs
    const slackWebhook = core.getInput('slack_webhook');
    const rssFeed = core.getInput('rss');
    const cacheDir = core.getInput('cache_dir');
    const interval = core.getInput('interval') ? parseInt(core.getInput('interval')) : undefined;
    const unfurl = core.getInput('unfurl') ? core.getBooleanInput('unfurl') : false;
    const showDesc = core.getInput('show_desc') ? core.getBooleanInput('show_desc') : true;
    const showLink = core.getInput('show_link') ? core.getBooleanInput('show_link') : true;
    const showDate = core.getInput('show_date') ? core.getBooleanInput('show_date') : true;

    // Get RSS feed items
    const { filtered, unfiltered, cached } = await getFeed(rssFeed, cacheDir, interval);

    if (filtered.length) {
      // Generate payload
      const payload = await genPayload(filtered, unfiltered, rssFeed, unfurl, showDesc, showDate, showLink);

      // Send payload to Slack
      await slack(payload, slackWebhook);

      // Save cache data
      if (cacheDir) await writeCache(unfiltered?.title || '', rssFeed, cacheDir, filtered, cached);
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
