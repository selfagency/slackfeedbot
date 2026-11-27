import * as core from "@actions/core";
import type { DeliverOptions } from "./lib/deliver.ts";
import type { DiscordRenderOptions } from "./lib/discord.ts";
import type {
  DeliverResult,
  DiscordPayload,
  Payload,
  RssFeed,
  RssFeedItem,
} from "./types.ts";

// Collaborators are injected so the orchestration can be integration-tested.
interface RunDeps {
  deliver: (
    payload: unknown,
    webhook: string,
    options: DeliverOptions
  ) => Promise<DeliverResult>;
  discord: (
    filtered: RssFeedItem[],
    unfiltered: RssFeed,
    opts: DiscordRenderOptions
  ) => DiscordPayload[];
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
  validate: () => void;
  writeCache: (
    feedTitle: string,
    rssFeed: string,
    cacheDir: string,
    filtered: RssFeedItem[],
    cached: string[]
  ) => Promise<void>;
}

// Delivers Discord messages sequentially (ordered payloads, webhook rate
// limits) without an awaited loop.
const deliverAll = async (
  messages: DiscordPayload[],
  deliver: (
    payload: unknown,
    webhook: string,
    options: DeliverOptions
  ) => Promise<DeliverResult>,
  discordWebhook: string,
  deliveries: DeliverResult[]
): Promise<void> => {
  const [next, ...rest] = messages;
  if (next === undefined) {
    return;
  }
  deliveries.push(await deliver(next, discordWebhook, { platform: "discord" }));
  await deliverAll(rest, deliver, discordWebhook, deliveries);
};

const run = async (deps: RunDeps): Promise<void> => {
  const {
    validate: check,
    getInput,
    getBooleanInput,
    getFeed: read,
    genPayload: buildSlack,
    discord: buildDiscord,
    deliver,
    writeCache: save,
  } = deps;

  try {
    check();

    const slackWebhook = getInput("slack_webhook");
    const discordWebhook = getInput("discord_webhook");
    if (slackWebhook.length > 0) {
      core.setSecret(slackWebhook);
    }
    if (discordWebhook.length > 0) {
      core.setSecret(discordWebhook);
    }
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

    if (filtered.length === 0) {
      core.info("No new items found");
      return;
    }

    // Deliver to every configured target; the cache is written only when
    // ALL targets succeed, so failed deliveries are retried on the next run.
    const deliveries: DeliverResult[] = [];

    if (slackWebhook.length > 0) {
      const payload = await buildSlack(
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
      deliveries.push(
        await deliver(payload, slackWebhook, { platform: "slack" })
      );
    }

    if (discordWebhook.length > 0) {
      const messages = buildDiscord(filtered, unfiltered, {
        feedName,
        feedImg,
        unfurl,
        showDesc,
        showImg,
        showDate,
      });
      await deliverAll(messages, deliver, discordWebhook, deliveries);
    }

    const failures = deliveries.filter((result) => !result.ok);
    if (failures.length > 0) {
      const detail = failures
        .map(
          (failure) =>
            `${failure.platform} ${failure.status}: ${failure.body.slice(0, 200)}`
        )
        .join("; ");
      core.setFailed(`Delivery failed — ${detail}`);
      return;
    }

    if (cacheDir) {
      await save(unfiltered.title || "", rssFeed, cacheDir, filtered, cached);
    }
  } catch (err) {
    core.debug("Operation failed due to error");
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
};

export { run };
