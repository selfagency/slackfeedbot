import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { RssFeed } from "../types.ts";
import { checkCache, readCache, writeCache } from "./cache.ts";

const FEED = "https://example.com/feed.xml";
const FEED_TITLE = "Test Feed";
const FIX_TS = Date.parse("2026-01-02T03:04:05Z");

let dir: string | undefined;

const makeDir = async (): Promise<string> => {
  const created = await mkdtemp(join(tmpdir(), "slackfeedbot-cache-"));
  dir = created;
  return created;
};

afterEach(async () => {
  if (dir !== undefined) {
    await rm(dir, { recursive: true, force: true });
    dir = undefined;
  }
});

const item = (title: string): { title: string; created: number } => ({
  title,
  created: FIX_TS,
});

describe("readCache", () => {
  it("throws a clear error when the cache file is missing", async () => {
    const cache = await makeDir();
    await expect(readCache(FEED, cache)).rejects.toThrowError(
      "Failed to read cache"
    );
  });
});

describe("writeCache/checkCache roundtrip", () => {
  it("persists published item hashes deterministically", async () => {
    const cache = await makeDir();
    await writeCache(
      FEED_TITLE,
      FEED,
      cache,
      [item("Hello"), item("World")],
      []
    );
    const path = join(cache, "example_com.json");
    const first = await readFile(path, "utf8");

    await writeCache(
      FEED_TITLE,
      FEED,
      cache,
      [item("Hello"), item("World")],
      []
    );
    const second = await readFile(path, "utf8");

    expect(first).toBe(second);
    const hashes: unknown = JSON.parse(first);
    expect(
      typeof hashes === "object" && hashes !== null && "length" in hashes
    ).toBe(true);
    expect((hashes as unknown[]).length).toBe(2);
  });

  it("marks previously written items as cached and keeps unseen items", async () => {
    const cache = await makeDir();
    await writeCache(FEED_TITLE, FEED, cache, [item("Seen")], []);
    const cached = await readCache(FEED, cache);

    const feed: RssFeed = {
      title: FEED_TITLE,
      items: [item("Seen"), item("Fresh")],
    };
    const fresh = await checkCache(feed, cached);

    expect(fresh.map((entry) => entry.title)).toEqual(["Fresh"]);
  });

  it("preserves existing hashes when appending new ones", async () => {
    const cache = await makeDir();
    await writeCache(FEED_TITLE, FEED, cache, [item("One")], []);
    const cached = await readCache(FEED, cache);
    await writeCache(FEED_TITLE, FEED, cache, [item("Two")], cached);
    const after = await readCache(FEED, cache);

    expect(after).toHaveLength(2);

    const feed: RssFeed = {
      title: FEED_TITLE,
      items: [item("One"), item("Two")],
    };
    const fresh = await checkCache(feed, after);
    expect(fresh).toEqual([]);
  });

  it("keys the cache file per feed hostname", async () => {
    const cache = await makeDir();
    await writeCache(FEED_TITLE, FEED, cache, [item("X")], []);
    const path = join(cache, "example_com.json");
    await expect(readFile(path, "utf8")).resolves.toBeTruthy();
  });

  it("hashes date-less items deterministically without a date component", async () => {
    const cache = await makeDir();
    await writeCache(
      FEED_TITLE,
      FEED,
      cache,
      [{ title: "NoDate", created: 0 }],
      []
    );
    const cached = await readCache(FEED, cache);

    const feed: RssFeed = {
      title: FEED_TITLE,
      items: [{ title: "NoDate", created: 0 }],
    };
    const fresh = await checkCache(feed, cached);
    expect(fresh).toEqual([]);
  });
});
