import core from "@actions/core";
import { writeCache } from "./lib/cache.ts";
import { getFeed } from "./lib/getfeed.ts";
import { genPayload } from "./lib/payload.ts";
import { slack } from "./lib/slack.ts";
import { validate } from "./lib/validate.ts";

const run = async () => {
  try {
    // Validate inputs
    validate();

    // Parse inputs
    const slackWebhook = core.getInput("slack_webhook");
    const rssFeed = core.getInput("rss");
    const feedName = core.getInput("feed_name");
    const feedImg = core.getInput("feed_image");
    const cacheDir = core.getInput("cache_dir");
    const interval =
      core.getInput("interval").length > 0
        ? Number.parseInt(core.getInput("interval"), 10)
        : undefined;
    const unfurl =
      core.getInput("unfurl").length > 0
        ? core.getBooleanInput("unfurl")
        : false;
    const showDesc =
      core.getInput("show_desc").length > 0
        ? core.getBooleanInput("show_desc")
        : true;
    const showLink =
      core.getInput("show_link").length > 0
        ? core.getBooleanInput("show_link")
        : true;
    const showDate =
      core.getInput("show_date").length > 0
        ? core.getBooleanInput("show_date")
        : true;
    const showImg =
      core.getInput("show_img").length > 0
        ? core.getBooleanInput("show_img")
        : true;

    core.debug(
      `Processed inputs: ${JSON.stringify({
        slackWebhook,
        rssFeed,
        feedName,
        feedImg,
        cacheDir,
        interval,
        unfurl,
        showDesc,
        showLink,
        showDate,
      })}`
    );

    // Get RSS feed items
    const { filtered, unfiltered, cached } = await getFeed(
      rssFeed,
      cacheDir,
      interval
    );

    if (filtered.length) {
      // Generate payload
      const payload = await genPayload(
        filtered,
        unfiltered,
        rssFeed,
        feedName,
        feedImg,
        unfurl,
        showDesc,
        showImg,
        showDate,
        showLink
      );

      // Send payload to Slack
      await slack(payload, slackWebhook);

      // Save cache data
      if (cacheDir) {
        await writeCache(
          unfiltered?.title || "",
          rssFeed,
          cacheDir,
          filtered,
          cached
        );
      }
    } else {
      core.info("No new items found");
    }
  } catch (err) {
    core.debug("Operation failed due to error");
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
};

(async () => {
  await run();
})();
