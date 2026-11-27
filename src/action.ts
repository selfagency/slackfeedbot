import * as core from "@actions/core";
import type { Payload, RssFeed, RssFeedItem } from "./types.ts";

// Collaborators are injected so the orchestration can be integration-tested.
interface RunDeps {
  genPayload: (
    filtered: RssFeedItem[],
    unfiltered: RssFeed,
    rssFeed: string,
    feedName: string,
    feedImg: string,
    unfurl: boolean,
    showDesc: boolean,
    showImg: boolean,
    showDate: boolean,
    showLink: boolean
  ) => Promise<Payload>;
  getBooleanInput: (name: string) => boolean;
  getFeed: (
    rssFeed: string,
    cacheDir: string | undefined,
    interval: number | undefined
  ) => Promise<{
    filtered: RssFeedItem[];
    unfiltered: RssFeed;
    cached: string[];
  }>;
  getInput: (name: string) => string;
  slack: (payload: Payload, webhook: string) => Promise<void>;
  validate: () => void;
  writeCache: (
    feedTitle: string,
    rssFeed: string,
    cacheDir: string,
    filtered: RssFeedItem[],
    cached: string[]
  ) => Promise<void>;
}

const run = async (deps: RunDeps): Promise<void> => {
  const {
    validate: check,
    getInput,
    getBooleanInput,
    getFeed: read,
    genPayload: build,
    slack: post,
    writeCache: save,
  } = deps;

  try {
    check();

    const slackWebhook = getInput("slack_webhook");
    const rssFeed = getInput("rss");
    const feedName = getInput("feed_name");
    const feedImg = getInput("feed_image");
    const cacheDir = getInput("cache_dir");
    const interval =
      getInput("interval").length > 0
        ? Number.parseInt(getInput("interval"), 10)
        : undefined;
    const unfurl =
      getInput("unfurl").length > 0 ? getBooleanInput("unfurl") : false;
    const showDesc =
      getInput("show_desc").length > 0 ? getBooleanInput("show_desc") : true;
    const showLink =
      getInput("show_link").length > 0 ? getBooleanInput("show_link") : true;
    const showDate =
      getInput("show_date").length > 0 ? getBooleanInput("show_date") : true;
    const showImg =
      getInput("show_img").length > 0 ? getBooleanInput("show_img") : true;

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

    const { filtered, unfiltered, cached } = await read(
      rssFeed,
      cacheDir,
      interval
    );

    if (filtered.length) {
      const payload = await build(
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

      await post(payload, slackWebhook);

      if (cacheDir) {
        await save(unfiltered.title || "", rssFeed, cacheDir, filtered, cached);
      }
    } else {
      core.info("No new items found");
    }
  } catch (err) {
    core.debug("Operation failed due to error");
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
};

export { run };
