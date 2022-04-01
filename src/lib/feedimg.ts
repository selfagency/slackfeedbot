import core from '@actions/core';
import fetch from 'node-fetch';
import type { Icons } from '../types.d';

// Gets the website's favicon
const getFeedImg = async (rssFeed: string): Promise<string | undefined> => {
  const url = new URL(rssFeed);
  const host = url.hostname
    .replace(/^status\./, '')
    .replace(/^feed\./, '')
    .replace(/^feeds\./, '')
    .replace(/^rss\./, '');
  core.debug(`Getting favicons for ${host}`);

  let favicon;
  try {
    const icons = <Icons>await (await fetch(`https:/favicongrabber.com/api/grab/${host}`)).json();
    core.debug(`Icons: ${JSON.stringify(icons)}`);

    if (icons?.icons) {
      favicon =
        icons.icons.find(i => i?.sizes === '180x180' || i?.sizes === '144x144' || i?.sizes === '72x72')?.src ||
        icons.icons[0]?.src;
      core.debug(`Favicon: ${favicon}`);
    }
  } catch (err) {
    core.debug((<Error>err).message);
    favicon = undefined;
  }

  return favicon;
};

export { getFeedImg };
