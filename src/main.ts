import * as core from "@actions/core";
import { run } from "./action.ts";
import { writeCache } from "./lib/cache.ts";
import { getFeed } from "./lib/getfeed.ts";
import { genPayload } from "./lib/payload.ts";
import { slack } from "./lib/slack.ts";
import { validate } from "./lib/validate.ts";

// Bundle entry point; only referenced by dist/index.cjs.
const main = async (): Promise<void> => {
  await run({
    validate,
    getInput: core.getInput,
    getBooleanInput: core.getBooleanInput,
    getFeed,
    genPayload,
    slack,
    writeCache,
  });
};

// run() never rejects: it funnels every error into core.setFailed.
void main();
