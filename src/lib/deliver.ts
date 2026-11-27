import type { DeliverResult, DeliveryPlatform } from "../types.ts";

const MAX_ATTEMPTS = 3;
const RETRY_FLOOR_MS = 1000;
const WEBHOOK_TIMEOUT_MS = 15_000;

const defaultSleep = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export interface DeliverOptions {
  fetchImpl?: typeof fetch;
  platform: DeliveryPlatform;
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
}

const retryAfterMs = (res: Response): number | undefined => {
  const header = res.headers.get("retry-after");
  if (header === null) {
    return undefined;
  }
  const seconds = Number(header);
  if (Number.isNaN(seconds)) {
    return undefined;
  }
  return Math.max(RETRY_FLOOR_MS, Math.ceil(seconds * 1000));
};

const isOk = (
  platform: DeliveryPlatform,
  status: number,
  body: string
): boolean => {
  if (platform === "slack") {
    return status === 200 && body === "ok";
  }
  // Discord: 204 (fire-and-forget) or 200 with the message when wait=true.
  return status === 204 || status === 200;
};

// Discord returns 204 even when a message fails to save unless wait=true is
// sent; setting it makes save failures real 400s that surface as delivery
// failures. Preserves any user-provided query params (e.g. thread_id).
const resolveTarget = (webhook: string, platform: DeliveryPlatform): string => {
  const target = new URL(webhook);
  if (platform === "discord") {
    target.searchParams.set("wait", "true");
  }
  return target.toString();
};

// POSTs a webhook payload, honoring 429 Retry-After (Slack and Discord both
// send it), bounded by MAX_ATTEMPTS. Never retries other failures.
const deliver = (
  payload: unknown,
  webhook: string,
  options: DeliverOptions
): Promise<DeliverResult> => {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const target = resolveTarget(webhook, options.platform);
  const timeoutMs = options.timeoutMs ?? WEBHOOK_TIMEOUT_MS;

  const attempt = async (n: number): Promise<DeliverResult> => {
    let res: Response;
    let body: string;
    try {
      res = await fetchImpl(target, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      body = await res.text();
    } catch (err) {
      // Timeouts and connection errors are failures for this target; no retry
      // (they are not rate limits).
      return {
        platform: options.platform,
        ok: false,
        status: 0,
        body: err instanceof Error ? err.message : String(err),
      };
    }

    if (res.status === 429 && n < MAX_ATTEMPTS) {
      const wait = retryAfterMs(res);
      if (wait !== undefined) {
        await sleep(wait);
        return attempt(n + 1);
      }
    }

    return {
      platform: options.platform,
      ok: isOk(options.platform, res.status, body),
      status: res.status,
      body,
    };
  };

  return attempt(1);
};

export { deliver };
