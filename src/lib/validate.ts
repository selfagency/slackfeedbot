import * as core from "@actions/core";

// Validate inputs
const validate = (): void => {
  core.debug("Validating inputs…");

  const rss = core.getInput("rss");
  const slackWebhook = core.getInput("slack_webhook");
  const discordWebhook = core.getInput("discord_webhook");
  const interval = core.getInput("interval");
  const cacheDir = core.getInput("cache_dir");

  // Webhook values are credentials; log presence, never the value.
  core.debug(
    `Inputs: ${JSON.stringify({
      rssFeed: rss,
      slackWebhook: slackWebhook.length > 0 ? "[set]" : "[unset]",
      discordWebhook: discordWebhook.length > 0 ? "[set]" : "[unset]",
      interval,
      unfurl: core.getInput("unfurl"),
      showDesc: core.getInput("show_desc"),
      showLink: core.getInput("show_link"),
      showDate: core.getInput("show_date"),
      showImg: core.getInput("show_img"),
    })}`
  );

  if (rss.length === 0 || !rss.startsWith("http")) {
    throw new Error("No feed or invalid feed specified");
  }

  const hasSlack = slackWebhook.length > 0;
  const hasDiscord = discordWebhook.length > 0;
  if (!(hasSlack || hasDiscord)) {
    throw new Error("No Slack or Discord webhook specified");
  }

  if (hasSlack && !slackWebhook.startsWith("https")) {
    throw new Error("No Slack webhook or invalid webhook specified");
  }

  if (
    hasDiscord &&
    !(
      discordWebhook.startsWith("https://") &&
      discordWebhook.includes("/api/webhooks/")
    )
  ) {
    throw new Error(
      "Discord webhook must be an https://discord.com/api/webhooks/ URL"
    );
  }

  if (interval.length === 0 && cacheDir.length === 0) {
    throw new Error("No interval or cache folder specified");
  }

  if (
    interval.length > 0 &&
    Number.parseInt(interval, 10).toString() === "NaN"
  ) {
    throw new Error("Invalid interval specified");
  }

  if (
    core.getInput("unfurl").length > 0 &&
    core.getBooleanInput("unfurl") &&
    (core.getInput("show_desc").length > 0 ||
      core.getInput("show_link").length > 0 ||
      core.getInput("show_date").length > 0 ||
      core.getInput("show_img").length > 0)
  ) {
    throw new Error("Unfurled links cannot be styled with `show` options");
  }
};

export { validate };
