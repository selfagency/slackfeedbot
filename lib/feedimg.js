import core from '@actions/core';
import fetch from 'node-fetch';

const getFeedImg = async rssFeed => {
  const url = new URL(rssFeed);
  const host = url.hostname
    .replace('//status.', '//')
    .replace('//feed.', '//')
    .replace('//feeds.', '//')
    .replace('//rss.', '//');
  core.debug(`Getting favicons for ${host}`);

  let favicon;
  try {
    let icons = await fetch(`https:/favicongrabber.com/api/grab/${host}`);
    icons = await icons.json();
    core.debug(`Icons: ${JSON.stringify(icons)}`);
    favicon = icons.icons.find(i => i?.sizes === '144x144')?.src || icons.icons[0]?.src;
    core.debug(`Favicon: ${favicon}`);
  } catch (err) {
    core.debug(err.message);
    favicon = undefined;
  }

  return favicon;
};

export { getFeedImg };
