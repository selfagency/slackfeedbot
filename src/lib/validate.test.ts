import { afterEach, describe, expect, it } from "vitest";
import { validate } from "./validate.ts";

const ENV_KEYS = [
  "INPUT_RSS",
  "INPUT_SLACK_WEBHOOK",
  "INPUT_DISCORD_WEBHOOK",
  "INPUT_CACHE_DIR",
  "INPUT_INTERVAL",
  "INPUT_UNFURL",
  "INPUT_SHOW_DESC",
  "INPUT_SHOW_LINK",
  "INPUT_SHOW_DATE",
  "INPUT_SHOW_IMG",
  "INPUT_FEED_NAME",
  "INPUT_FEED_IMAGE",
] as const;

const setInput = (key: string, value: string | undefined): void => {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
};

const setInputs = (inputs: Record<string, string | undefined>): void => {
  for (const key of ENV_KEYS) {
    const name = key.replace("INPUT_", "").toLowerCase();
    setInput(key, inputs[name]);
  }
};

afterEach(() => {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
});

describe("validate", () => {
  it("accepts a valid rss + webhook + interval", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      slack_webhook: "https://hooks.slack.com/services/T/B/X",
      interval: "15",
    });
    expect(() => {
      validate();
    }).not.toThrow();
  });

  it("accepts cache_dir instead of interval", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      slack_webhook: "https://hooks.slack.com/services/T/B/X",
      cache_dir: "./cache",
    });
    expect(() => {
      validate();
    }).not.toThrow();
  });

  it("rejects a missing or non-http rss feed", () => {
    setInputs({
      slack_webhook: "https://hooks.slack.com/services/T/B/X",
      interval: "15",
    });
    expect(() => {
      validate();
    }).toThrowError("No feed or invalid feed specified");

    setInputs({
      rss: "ftp://example.com/feed",
      slack_webhook: "https://hooks.slack.com/services/T/B/X",
    });
    expect(() => {
      validate();
    }).toThrowError("No feed or invalid feed specified");
  });

  it("rejects runs without any webhook", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      interval: "15",
    });
    expect(() => {
      validate();
    }).toThrowError("No Slack or Discord webhook specified");
  });

  it("accepts a Discord webhook alone", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      discord_webhook: "https://discord.com/api/webhooks/123/token",
      interval: "15",
    });
    expect(() => {
      validate();
    }).not.toThrow();
  });

  it("rejects a Discord webhook outside the api/webhooks path", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      discord_webhook: "https://example.com/api/not-a-webhook",
      interval: "15",
    });
    expect(() => {
      validate();
    }).toThrowError(
      "Discord webhook must be an https://discord.com/api/webhooks/ URL"
    );
  });

  it("rejects a missing or non-https webhook", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      interval: "15",
    });
    expect(() => {
      validate();
    }).toThrowError("No Slack or Discord webhook specified");

    setInputs({
      rss: "https://example.com/feed.xml",
      slack_webhook: "http://hooks.slack.com/services/T/B/X",
      interval: "15",
    });
    expect(() => {
      validate();
    }).toThrowError("No Slack webhook or invalid webhook specified");
  });

  it("rejects runs without cache_dir or interval", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      slack_webhook: "https://hooks.slack.com/services/T/B/X",
    });
    expect(() => {
      validate();
    }).toThrowError("No interval or cache folder specified");
  });

  it("rejects a non-numeric interval", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      slack_webhook: "https://hooks.slack.com/services/T/B/X",
      interval: "abc",
    });
    expect(() => {
      validate();
    }).toThrowError("Invalid interval specified");
  });

  it("rejects unfurl combined with show_* styling", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      slack_webhook: "https://hooks.slack.com/services/T/B/X",
      interval: "15",
      unfurl: "true",
      show_desc: "true",
    });
    expect(() => {
      validate();
    }).toThrowError("Unfurled links cannot be styled with `show` options");
  });

  it("accepts unfurl without show_* styling", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      slack_webhook: "https://hooks.slack.com/services/T/B/X",
      interval: "15",
      unfurl: "true",
    });
    expect(() => {
      validate();
    }).not.toThrow();
  });

  it("rejects an unfurl value that is not a boolean", () => {
    setInputs({
      rss: "https://example.com/feed.xml",
      slack_webhook: "https://hooks.slack.com/services/T/B/X",
      interval: "15",
      unfurl: "yes-please",
    });
    expect(() => {
      validate();
    }).toThrowError();
  });
});
