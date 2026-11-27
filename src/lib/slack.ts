import * as core from "@actions/core";
import type { Payload } from "../types.ts";

// Publishes messages to Slack
const slack = async (payload: Payload, webhook: string) => {
  const res = await fetch(webhook, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    },
  });
  core.debug(`Slack response: ${await res.text()}`);
};

export { slack };
