import * as core from "@actions/core";
import { run } from "./action.ts";
import { writeCache } from "./lib/cache.ts";
import { deliver } from "./lib/deliver.ts";
import { buildDiscordMessages } from "./lib/discord.ts";
import { getFeed } from "./lib/getfeed.ts";
import { genPayload } from "./lib/payload.ts";
import { validate } from "./lib/validate.ts";

// Bundle entry point; only referenced by dist/index.cjs.
const main = async (): Promise<void> => {
  await run({
    validate,
    getInput: core.getInput,
    getBooleanInput: core.getBooleanInput,
    getFeed,
    genPayload,
    discord: buildDiscordMessages,
    deliver,
    writeCache,
  });
};

// run() never rejects: it funnels every error into core.setFailed.
void main();
