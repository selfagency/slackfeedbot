import { compile } from 'html-to-text';
import core from '@actions/core';
import dayjs from 'dayjs';
import fetch from 'node-fetch';
import { parse } from 'rss-to-json';

const html2txt = compile({
  wordwrap: 120
});

const { debug, setFailed, getInput } = core;

const validate = () => {
  if (!getInput('rss') || !getInput('rss').startsWith('http')) {
    throw new Error('No feed or invalid feed specified');
  }

  if (!getInput('slack_webhook') || !getInput('slack_webhook').startsWith('https')) {
    throw new Error('No Slack webhook or invalid webhook specified');
  }

  if (!getInput('interval') || parseInt(getInput('interval')).toString() === 'NaN') {
    throw new Error('No interval or invalid interval specified');
  }
};

const getFeedImg = async rssFeed => {
  const url = new URL(rssFeed);
  let icons = await fetch(`https:/favicongrabber.com/api/grab/${url.hostname}`);
  icons = await icons.json();
  debug(icons);
  const favicon = icons.icons.find(i => i?.sizes === '72x72')?.src;
  debug(favicon);
  return favicon;
};

const run = async () => {
  try {
    debug(`Validating inputs`);
    validate();

    const rssFeed = getInput('rss');
    const slackWebhook = getInput('slack_webhook');
    const interval = parseInt(getInput('interval'));
    const unfurl = getInput('unfurl').toString() === 'true';

    debug(`Retrieving ${rssFeed}`);
    const rss = await parse(rssFeed);
    // debug(rss);

    debug('Checking for feed items');
    if (rss?.items?.length) {
      debug(`Selecting items posted in the last ${interval} minutes`);
      const toSend = rss.items.filter(item => dayjs(item.created).isAfter(dayjs().subtract(interval, 'minute')));

      const blocks = toSend.map(item => {
        let text = '';

        if (!unfurl) {
          if (item.title) text += `*${html2txt(item.title)}*\n`;
          if (item.description) {
            let description = html2txt(item.description)
              .replace(/[Rr]ead more/g, '')
              .replace(/\n/g, ' ');
            if (item.description.length > 140) {
              description = `${description.substring(0, 140)}...\n`;
            } else {
              description += `${description}\n`;
            }
            text += description;
          }
          if (item.link) text += `<${item.link}|Read more>`;
        } else {
          if (item.title) text += `<${item.link}|${html2txt(item.title)}>`;
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
      const payload = {
        as_user: false,
        username: html2txt(rss.title) || 'FeedBot',
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
