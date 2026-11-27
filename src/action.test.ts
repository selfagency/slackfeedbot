import { mkdtemp, readFile, rm } from "node:fs/promises";
import type { Server } from "node:http";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as core from "@actions/core";
import { afterEach, describe, expect, it } from "vitest";
import { run } from "./action.ts";
import { writeCache } from "./lib/cache.ts";
import { getFeed } from "./lib/getfeed.ts";
import { genPayload } from "./lib/payload.ts";
import { slack } from "./lib/slack.ts";
import { validate } from "./lib/validate.ts";

let feedServer: Server | undefined;
let slackServer: Server | undefined;
const _feedUrl = "";
let slackUrl = "";
const slackCalls: string[] = [];

const listen = (srv: Server): Promise<number> =>
  new Promise((resolve) => {
    srv.listen(0, "127.0.0.1", () => {
      const address = srv.address();
      resolve(typeof address === "object" && address ? address.port : 0);
    });
  });

const startFeed = async (xml: string): Promise<string> => {
  feedServer = createServer((req, res) => {
    if (req.url?.startsWith("/feed")) {
      res.writeHead(200, { "content-type": "application/rss+xml" });
      res.end(xml);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  const port = await listen(feedServer);
  return `http://127.0.0.1:${port}/feed`;
};

const startSlack = async (): Promise<void> => {
  slackServer = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk: Buffer) => {
      raw += chunk.toString();
    });
    req.on("end", () => {
      slackCalls.push(raw);
      res.writeHead(200, { "content-type": "text/plain" });
      res.end("ok");
    });
  });
  const port = await listen(slackServer);
  slackUrl = `http://127.0.0.1:${port}/services/T/B/X`;
};

const RSS_SINGLE = `<rss version="2.0"><channel><title>Test Feed</title><link>https://example.com</link><description>d</description><item><title>Post 1</title><link>https://example.com/1</link><pubDate>${new Date().toUTCString()}</pubDate><description><![CDATA[<p>Hello there</p>]]></description></item></channel></rss>`;
const RSS_EMPTY = `<rss version="2.0"><channel><title>Test Feed</title><link>https://example.com</link><description>d</description></channel></rss>`;

const depsFor = (inputs: Record<string, string>) => ({
  validate: () => undefined,
  getInput: (name: string): string => inputs[name] ?? "",
  getBooleanInput: (name: string): boolean => (inputs[name] ?? "") === "true",
  getFeed,
  genPayload,
  slack,
  writeCache,
});

afterEach(async () => {
  for (const key of ["INPUT_RSS", "INPUT_SLACK_WEBHOOK", "INPUT_CACHE_DIR"]) {
    delete process.env[key];
  }
  await Promise.all(
    [feedServer, slackServer]
      .filter((srv): srv is Server => srv !== undefined)
      .map(
        (srv) =>
          new Promise<void>((resolve) => {
            srv.close(() => resolve());
          })
      )
  );
  feedServer = undefined;
  slackServer = undefined;
  slackCalls.length = 0;
});

describe("run (end to end)", () => {
  it("posts new items to Slack and writes the cache", async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), "slackfeedbot-run-"));
    const feed = await startFeed(RSS_SINGLE);
    await startSlack();

    await run(
      depsFor({
        rss: feed,
        slack_webhook: slackUrl,
        feed_image: "https://example.com/icon.png",
        cache_dir: cacheDir,
      })
    );

    expect(slackCalls).toHaveLength(1);
    const payload = JSON.parse(slackCalls[0]);
    expect(payload.username).toBe("Test Feed");
    expect(payload.icon_url).toBe("https://example.com/icon.png");
    expect(payload.blocks[0].text.text).toBe("Post 1");
    expect(JSON.stringify(payload.blocks)).toContain("Hello there");

    const cached = JSON.parse(
      await readFile(join(cacheDir, "127_0_0_1.json"), "utf8")
    ) as unknown[];
    expect(cached).toHaveLength(1);

    await rm(cacheDir, { recursive: true, force: true });
  });

  it("is a no-op for an empty feed", async () => {
    const cacheDir = await mkdtemp(join(tmpdir(), "slackfeedbot-run-"));
    const feed = await startFeed(RSS_EMPTY);
    await startSlack();

    await run(
      depsFor({
        rss: feed,
        slack_webhook: slackUrl,
        feed_image: "https://example.com/icon.png",
        cache_dir: cacheDir,
      })
    );

    expect(slackCalls).toHaveLength(0);

    await rm(cacheDir, { recursive: true, force: true });
  });

  it("fails loudly on invalid inputs without touching Slack", async () => {
    await startSlack();
    process.env.INPUT_RSS = "";
    process.env.INPUT_SLACK_WEBHOOK = "";
    delete process.env.INPUT_CACHE_DIR;

    await expect(
      run({
        validate,
        getInput: core.getInput,
        getBooleanInput: core.getBooleanInput,
        getFeed,
        genPayload,
        slack,
        writeCache,
      })
    ).resolves.toBeUndefined();
    expect(slackCalls).toHaveLength(0);
  });
});
