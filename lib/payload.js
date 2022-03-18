import core from '@actions/core';
import { compile } from 'html-to-text';
import { DOMParser } from 'linkedom';
import * as showdown from 'showdown';
import { getFeedImg } from './feedimg.js';

const converter = new showdown.default.Converter();
const html2txt = compile({
  wordwrap: 120
});

const genPayload = async (filtered, unfiltered, rssFeed, unfurl) => {
  try {
    const blocks = filtered.map(item => {
      let text = '';

      if (!unfurl) {
        if (item.title) text += `*${html2txt(item.title)}*\n`;
        if (item.description) {
          core.debug(`Item description: ${item.description}`);
          const markdown = converter.makeMarkdown(
            item.description,
            new DOMParser().parseFromString('<div></div>', 'text/html')
          );
          text += `${markdown.replace(/[Rr]ead more/g, '…').replace(/\n/g, ' ')}\n`;
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

    const payload = {
      as_user: false,
      username: unfiltered.title ? html2txt(unfiltered.title) : 'FeedBot',
      icon_url: await getFeedImg(rssFeed),
      unfurl_links: unfurl,
      unfurl_media: unfurl,
      blocks
    };

    return payload;
  } catch (err) {
    core.debug(err.message);
    throw new Error('Failed to generated Slack payload');
  }
};

export { genPayload };
