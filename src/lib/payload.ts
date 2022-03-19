import core from '@actions/core';
import dayjs from 'dayjs';
import { compile } from 'html-to-text';
import { parseHTML } from 'linkedom';
import showdown from 'showdown';
import striptags from 'striptags';
import type { Block, Payload, RssFeed, RssFeedItem } from '../types.d';
import { getFeedImg } from './feedimg';

const converter = new showdown.Converter();
const html2txt = compile({
  wordwrap: 255
});

// Generates the payload to publish to Slack
const genPayload = async (
  filtered: RssFeedItem[],
  unfiltered: RssFeed,
  rssFeed: string,
  unfurl: boolean,
  showDesc: boolean,
  showImg: boolean,
  showDate: boolean,
  showLink: boolean
): Promise<Payload> => {
  try {
    const blocks: Block[] = [];
    filtered.forEach(item => {
      let text = '';

      if (!unfurl) {
        if (item.description) {
          // core.debug(`Item description: ${item.description}`);
          const { document } = parseHTML('<div></div>');
          const desc = striptags(
            item.description.replace(/&gt;/g, '>').replace(/&lt;/g, '<'),
            ['p', 'strong', 'b', 'em', 'i', 'a', 'ul', 'ol', 'li'],
            ' '
          );
          const markdown = converter.makeMarkdown(desc, document);
          text += `${markdown.replace(/\\-/g, '-').replace(/\\\|/g, '|')}`;
        }
      }

      if (item?.title) {
        blocks.push({
          type: 'header',
          text: { type: 'plain_text', text: html2txt(item?.title) }
        });
      }

      if (unfurl) {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<${item?.link}|Read more>`
          }
        });
      } else {
        const fields = [];

        if (showLink) {
          fields.push({
            type: 'mrkdwn',
            text: `<${item?.link}|Read more>`
          });
        }

        blocks.push({
          type: 'section',
          fields,
          accessory:
            showImg && item.image
              ? {
                  type: 'image',
                  image_url: item.image
                }
              : undefined,
          text:
            showDesc && !text.trim().toLowerCase().startsWith('read more')
              ? {
                  type: 'mrkdwn',
                  text
                }
              : undefined
        });

        if (showDate) {
          blocks.push({
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `Published ${dayjs(item?.created)?.format('MMM D @ h:mma')}` }]
          });
        }
      }
    });

    const payload = {
      as_user: false,
      username: unfiltered.title ? html2txt(unfiltered.title) : 'FeedBot',
      icon_url: await getFeedImg(rssFeed),
      unfurl_links: unfurl,
      unfurl_media: unfurl,
      blocks
    };

    core.debug(JSON.stringify(payload));
    return payload;
  } catch (err) {
    core.debug((<Error>err).message);
    throw new Error('Failed to generated Slack payload');
  }
};

export { genPayload };
