import core from '@actions/core';
import { compile } from 'html-to-text';
import { parseHTML } from 'linkedom';
import showdown from 'showdown';
import type { Block, Payload, RssFeed, RssFeedItem } from '../types.d';
import { getFeedImg } from './feedimg';

showdown.extension('striptags', function () {
  return [{ type: 'lang', regex: /<\/?small.?>|<\/?var.?>/gm, replace: '' }];
});

const converter = new showdown.Converter();
const html2txt = compile({
  wordwrap: 120
});

const genPayload = async (
  filtered: RssFeedItem[],
  unfiltered: RssFeed,
  rssFeed: string,
  unfurl: boolean
): Promise<Payload> => {
  try {
    const blocks: Block[] = filtered.map(item => {
      let text = '';

      if (!unfurl) {
        if (item.title) text += `*${html2txt(item.title)}*\n`;
        if (item.description) {
          core.debug(`Item description: ${item.description}`);
          const { document } = parseHTML('<div></div>');
          let desc = item.description;
          if (/&gt;.+&lt;/.test(item.description)) {
            desc = item.description.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
          }
          const markdown = converter.makeMarkdown(desc, document);
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
    core.debug((<Error>err).message);
    throw new Error('Failed to generated Slack payload');
  }
};

export { genPayload };
