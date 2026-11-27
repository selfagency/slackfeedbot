import { describe, expect, it } from "vitest";
import type { DeliverResult } from "../types.ts";
import { deliver } from "./deliver.ts";

const SLACK = "https://hooks.slack.com/services/T/B/X";
const DISCORD = "https://discord.com/api/webhooks/123/token";

const fetchOnce = (
  status: number,
  body: string | null,
  headers?: Record<string, string>
) => {
  const calls = { count: 0 };
  const impl = ((): Promise<Response> => {
    calls.count += 1;
    return Promise.resolve(
      new Response(body, {
        status,
        headers: { "content-type": "text/plain", ...headers },
      })
    );
  }) as unknown as typeof fetch;
  return { impl, calls };
};

const noSleep = (): Promise<void> => Promise.resolve();

const sleepCalls: number[] = [];
const timedSleep = (ms: number): Promise<void> => {
  sleepCalls.push(ms);
  return Promise.resolve();
};

describe("deliver", () => {
  it("treats Slack 200 + 'ok' as success and other bodies as failure", async () => {
    const ok = fetchOnce(200, "ok");
    const okResult = await deliver({}, SLACK, {
      platform: "slack",
      fetchImpl: ok.impl,
    });
    expect(okResult.ok).toBe(true);

    const bad = fetchOnce(200, "invalid_payload");
    const badResult = await deliver({}, SLACK, {
      platform: "slack",
      fetchImpl: bad.impl,
    });
    expect(badResult.ok).toBe(false);
    expect(badResult.body).toBe("invalid_payload");
  });

  it("treats Discord 200/204 as success", async () => {
    const a = fetchOnce(204, null);
    expect(
      (await deliver({}, DISCORD, { platform: "discord", fetchImpl: a.impl }))
        .ok
    ).toBe(true);

    const b = fetchOnce(200, "{}");
    expect(
      (await deliver({}, DISCORD, { platform: "discord", fetchImpl: b.impl }))
        .ok
    ).toBe(true);
  });

  it("fails on a 400 without retrying", async () => {
    const f = fetchOnce(400, "invalid_payload");
    const result = await deliver({}, SLACK, {
      platform: "slack",
      fetchImpl: f.impl,
      sleep: noSleep,
    });
    expect(result.ok).toBe(false);
    expect(f.calls.count).toBe(1);
  });

  it("honors 429 Retry-After once, then succeeds", async () => {
    const results: DeliverResult[] = [];
    let count = 0;
    const impl = ((): Promise<Response> => {
      count += 1;
      if (count === 1) {
        return Promise.resolve(
          new Response("rate limited", {
            status: 429,
            headers: { "retry-after": "2" },
          })
        );
      }
      return Promise.resolve(new Response("ok", { status: 200 }));
    }) as unknown as typeof fetch;

    results.push(
      await deliver({}, SLACK, {
        platform: "slack",
        fetchImpl: impl,
        sleep: timedSleep,
      })
    );

    expect(results[0].ok).toBe(true);
    expect(count).toBe(2);
    expect(sleepCalls).toEqual([2000]);
  });

  it("gives up after 3 rate-limited attempts", async () => {
    const impl = (async (): Promise<Response> =>
      new Response("rate limited", {
        status: 429,
        headers: { "retry-after": "1" },
      })) as unknown as typeof fetch;

    const result = await deliver({}, SLACK, {
      platform: "slack",
      fetchImpl: impl,
      sleep: noSleep,
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(429);
  });

  it("never retries a 404 (dead webhook)", async () => {
    const f = fetchOnce(404, "channel_not_found");
    const result = await deliver({}, SLACK, {
      platform: "slack",
      fetchImpl: f.impl,
      sleep: noSleep,
    });
    expect(result.ok).toBe(false);
    expect(f.calls.count).toBe(1);
  });
});
