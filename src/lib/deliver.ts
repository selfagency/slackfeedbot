import type { DeliverResult, DeliveryPlatform } from "../types.ts";

const MAX_ATTEMPTS = 3;
const RETRY_FLOOR_MS = 1000;

const defaultSleep = (ms: number): Promise<void> =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export interface DeliverOptions {
  fetchImpl?: typeof fetch;
  platform: DeliveryPlatform;
  sleep?: (ms: number) => Promise<void>;
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

// POSTs a webhook payload, honoring 429 Retry-After (Slack and Discord both
// send it), bounded by MAX_ATTEMPTS. Never retries other failures.
const deliver = (
  payload: unknown,
  webhook: string,
  options: DeliverOptions
): Promise<DeliverResult> => {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;

  const attempt = async (n: number): Promise<DeliverResult> => {
    const res = await fetchImpl(webhook, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
      },
    });
    const body = await res.text();

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
