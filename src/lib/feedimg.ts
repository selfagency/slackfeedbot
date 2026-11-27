import * as core from "@actions/core";
import type { Icons } from "../types.ts";

const STRIP_PREFIX_RE = /^(status|feeds?|rss)\./u;

// Gets the website's favicon
const getFeedImg = async (rssFeed: string): Promise<string | undefined> => {
  const url = new URL(rssFeed);
  const host = url.hostname.replace(STRIP_PREFIX_RE, "");
  core.debug(`Getting favicons for ${host}`);

  let favicon: string | undefined;
  try {
    const icons = (await (
      await fetch(`https://favicongrabber.com/api/grab/${host}`)
    ).json()) as Icons | undefined;
    core.debug(`Icons: ${JSON.stringify(icons)}`);

    if (icons?.icons) {
      favicon =
        icons.icons.find(
          (i) =>
            i?.sizes === "180x180" ||
            i?.sizes === "144x144" ||
            i?.sizes === "72x72"
        )?.src || icons.icons[0]?.src;
      core.debug(`Favicon: ${favicon}`);
    }
  } catch (err) {
    core.debug(err instanceof Error ? err.message : String(err));
    favicon = undefined;
  }

  return favicon;
};

export { getFeedImg };
