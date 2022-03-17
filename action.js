import core from '@actions/core';
import dayjs from 'dayjs';
import fetch from 'node-fetch';
import parse from 'rss-to-json';

const { info, debug, setFailed } = core;
const { RSS, SLACK_WEBHOOK, INTERVAL, UNFURL } = process.env;

const validate = () => {
  if (!RSS || !RSS.startsWith('http')) {
    throw new Error('No feed or invalid feed specified');
  }

  if (!SLACK_WEBHOOK || !SLACK_WEBHOOK.startsWith('https')) {
    throw new Error('No Slack webhook or invalid webhook specified');
  }

  if (!INTERVAL || parseInt(INTERVAL).toString() !== 'NaN') {
    throw new Error('No interval or invalid interval specified');
  }
};

const getFeedImg = (rss, rssFeed) => {
  if (rss?.feed?.image) {
    return rss.feed.image;
  } else {
    const url = new URL(rssFeed);
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&size=32`;
  }
};

const run = async () => {
  try {
    core.debug(`Validating inputs`);
    validate();

    core.debug(`Processing ${rssFeeds.length} feeds`);

    core.debug(`Retrieving ${event.inputs.rss}`);
    const rss = await parse(RSS);

    core.debug('Checking for feed items');
    if (rss?.items?.length) {
      core.debug(`Selecting items posted in the last ${INTERVAL} minutes`);
      const toSend = rss.items.filter(item => dayjs(item.published).isAfter(dayjs().subtract(INTERVAL, 'minute')));

      core.debug(`Sending ${toSend.length} item(s)`);
      const payload = {
        as_user: false,
        username: rss.title || 'FeedBot',
        icon_url: getFeedImg(rss, RSS),
        unfurl_links: UNFURL,
        unfurl_media: UNFURL,
        blocks: toSend.forEach(item => {
          const date = dayjs(item.published).format('MMM D @ h:mma Z');
          let text = '';
          if (UNFURL) {
            text = `<${item.link}|${item.title}> · ${date}`;
          } else {
            if (item.title) text += `*${item.title}* · ${date}\n`;
            if (item.description) {
              if (item.description.length > 255) {
                text += `${item.description.substring(0, 254)}...\n`;
              } else {
                text += `${item.description}\n`;
              }
            }
            if (item.link) text += `<${item.link}|Read more>`;
          }

          return {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text
            }
          };
        })
      };

      fetch(SLACK_WEBHOOK, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          Accept: 'application/json'
        }
      });
    } else {
      throw new Error('No feed items found');
    }
  } catch (err) {
    core.debug('Operation failed due to error');
    setFailed(err.message);
    process.exit(1);
  }
};
