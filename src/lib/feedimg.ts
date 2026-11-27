import * as core from "@actions/core";
import type { Icons } from "../types.ts";

const STRIP_PREFIX_RE = /^(?:status|feeds?|rss)\./u;

const FAVICON_TIMEOUT_MS = 10_000;

// Icon sizes to prefer, best first; falls back to whichever icon exists
const PREFERRED_SIZES = ["180x180", "144x144", "72x72"];

const pickIcon = (icons: NonNullable<Icons["icons"]>): string | undefined => {
  for (const size of PREFERRED_SIZES) {
    const hit = icons.find((icon) => icon?.sizes === size && icon?.src);
    if (hit?.src) {
      return hit.src;
    }
  }
  return icons[0]?.src;
};

// Gets the website's favicon
const getFeedImg = async (
  rssFeed: string,
  baseUrl = "https://favicongrabber.com",
  timeoutMs: number = FAVICON_TIMEOUT_MS
): Promise<string | undefined> => {
  const url = new URL(rssFeed);
  const host = url.hostname.replace(STRIP_PREFIX_RE, "");
  core.debug(`Getting favicons for ${host}`);

  let favicon: string | undefined;
  try {
    const res = await fetch(`${baseUrl}/api/grab/${host}`, {
      signal: AbortSignal.timeout(timeoutMs),
    });
    const icons = (await res.json()) as Icons | undefined;
    core.debug(`Icons: ${JSON.stringify(icons)}`);

    if (icons?.icons) {
      favicon = pickIcon(icons.icons);
      core.debug(`Favicon: ${favicon}`);
    }
  } catch (err) {
    core.debug(err instanceof Error ? err.message : String(err));
    favicon = undefined;
  }

  return favicon;
};

export { getFeedImg };
