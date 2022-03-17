import { mkdir, readFile, writeFile } from 'fs';

import { compile } from 'html-to-text';
import core from '@actions/core';
import { createHash } from 'crypto';
import dayjs from 'dayjs';
import fetch from 'node-fetch';
import html2md from 'html-to-md';
import { parse } from 'rss-to-json';
import { promisify } from 'util';

const read = promisify(readFile);
const write = promisify(writeFile);
const md = promisify(mkdir);
const { debug, setFailed, getInput, getBooleanInput } = core;
const html2txt = compile({
  wordwrap: 120
});

function hash(string) {
  return createHash('sha256').update(string).digest('hex');
}

const validate = () => {
  if (!getInput('rss') || !getInput('rss').startsWith('http')) {
    throw new Error('No feed or invalid feed specified');
  }

  if (!getInput('slack_webhook') || !getInput('slack_webhook').startsWith('https')) {
    throw new Error('No Slack webhook or invalid webhook specified');
  }

  if (!getInput('interval') && !getInput('cache_dir')) {
    throw new Error('No interval or cache folder specified');
  }

  if (getInput('interval') && parseInt(getInput('interval')).toString() === 'NaN') {
    throw new Error('Invalid interval specified');
  }
};

const getFeedImg = async rssFeed => {
  const url = new URL(rssFeed);
  let favicon;

  try {
    let icons = await fetch(
      `https:/favicongrabber.com/api/grab/${url.hostname
        .replace('//status.', '//')
        .replace('//feed.', '//')
        .replace('//fees.', '//')
        .replace('//rss.', '//')}`
    );
    icons = await icons.json();
    debug(icons);
    favicon = icons.icons.find(i => i?.sizes === '144x144')?.src || icons.icons[0]?.src;
    debug(favicon);
  } catch {
    debug('Favicon not found');
    favicon = undefined;
  }

  return favicon;
};

const run = async () => {
  try {
    debug(`Validating inputs`);
    validate();

    const rssFeed = getInput('rss');
    const rssFeedUrl = new URL(rssFeed);
    const slackWebhook = getInput('slack_webhook');
    const interval = parseInt(getInput('interval'));
    const unfurl = getBooleanInput('unfurl');
    const cacheDir = getInput('cache_dir');
    const cachePath = `${cacheDir}/${rssFeedUrl.hostname.replace(/\./g, '_')}.json`;

    debug(`Retrieving ${rssFeed}`);
    const rss = await parse(rssFeed);
    // debug(rss);

    debug('Checking for feed items');
    if (rss?.items?.length) {
      let toSend = [];
      let published = [];
      if (cacheDir) {
        debug(`Retrieving previously published entries`);
        try {
          published = JSON.parse(await read(cachePath, 'utf8'));
          debug(published);

          toSend = rss.items.filter(item => {
            return !published.find(pubbed => pubbed === hash(JSON.stringify(item.title + item.created)));
          });
        } catch (err) {
          debug(err.message);
          toSend = rss.items.filter(item => {
            return dayjs(item.created).isAfter(dayjs().subtract(60, 'minute'));
          });
        }
      } else {
        debug(`Selecting items posted in the last ${interval} minutes`);
        toSend = rss.items.filter(item => {
          return dayjs(item.created).isAfter(dayjs().subtract(interval, 'minute'));
        });
      }

      const blocks = toSend.map(item => {
        let text = '';

        if (!unfurl) {
          if (item.title) text += `*${html2txt(item.title)}*\n`;
          if (item.description) {
            const description = html2md(item.description)
              .replace(/[Rr]ead more/g, '…')
              .replace(/\n/g, ' ');
            text += `${description}\n`;
          }
          if (item.link) text += `<${item.link}|Read more>`;
        } else {
          if (item.title) text += `<${item.link}|${html2txt(item.title + item.created)}>`;
        }

        return {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text
          }
        };
      });
      // debug(blocks);

      debug(`Sending ${toSend.length} item(s)`);
      if (toSend.length > 0) {
        const payload = {
          as_user: false,
          username: rss.title ? html2txt(rss.title) : 'FeedBot',
          icon_url: await getFeedImg(rssFeed),
          unfurl_links: unfurl,
          unfurl_media: unfurl,
          blocks
        };
        debug(payload);

        const res = await fetch(slackWebhook, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Accept: 'application/json'
          }
        });
        debug(res);

        if (cacheDir) {
          debug(`Writing cache to ${cachePath}`);
          try {
            await md(cacheDir, { recursive: true });
          } catch (err) {
            debug(err.message);
          }

          await write(
            cachePath,
            JSON.stringify([...published, ...toSend.map(item => hash(JSON.stringify(item.title)))])
          );
        }
      }
    } else {
      throw new Error('No feed items found');
    }
  } catch (err) {
    debug('Operation failed due to error');
    setFailed(err.message);
    process.exit(1);
  }
};

(async () => {
  await run();
})();
