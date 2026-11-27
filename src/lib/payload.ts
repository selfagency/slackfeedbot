import * as core from "@actions/core";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import type {
  Block,
  BlockText,
  Payload,
  RssFeed,
  RssFeedItem,
} from "../types.ts";
import { getFeedImg } from "./feedimg.ts";
import {
  escapeSlack,
  htmlToMrkdwn,
  plainTitle,
  sanitizeUrl,
} from "./markdown.ts";

dayjs.extend(utc);

// Generates the Slack payload to publish
const genPayload = async (
  filtered: RssFeedItem[],
  unfiltered: RssFeed,
  rssFeed: string,
  feedName: string,
  feedImg: string,
  unfurl: boolean,
  showDesc: boolean,
  showImg: boolean,
  showDate: boolean,
  showLink: boolean
): Promise<Payload> => {
  const blocks: Block[] = [];
  for (const item of filtered) {
    let text = "";

    if (!unfurl && item.description) {
      text = htmlToMrkdwn(item.description, "slack");
    }

    if (item.title) {
      blocks.push({
        type: "header",
        text: { type: "plain_text", text: escapeSlack(plainTitle(item.title)) },
      });
    }

    if (unfurl) {
      if (item.link) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: `<${sanitizeUrl(item.link)}|Read more>`,
          },
        });
      }
    } else {
      const fields: BlockText[] = [];

      if (showLink && item.link) {
        fields.push({
          type: "mrkdwn",
          text: `<${sanitizeUrl(item.link)}|Read more>`,
        });
      }

      blocks.push({
        type: "section",
        fields,
        accessory:
          showImg && item.image
            ? {
                type: "image",
                image_url: item.image,
              }
            : undefined,
        text:
          showDesc && !text.trim().toLowerCase().startsWith("read more")
            ? {
                type: "mrkdwn",
                text,
              }
            : undefined,
      });

      if (showDate) {
        blocks.push({
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `Published ${dayjs(item.created ?? 0)
                .utc()
                .format("MMM D @ h:mma")} UTC`,
            },
          ],
        });
      }
    }
  }

  const firstTitle = filtered.find((item) => item.title !== undefined)?.title;
  const text = firstTitle
    ? escapeSlack(plainTitle(firstTitle))
    : `${filtered.length} new feed items`;
  const chosenName = feedName.length
    ? feedName
    : unfiltered.title
      ? plainTitle(unfiltered.title)
      : "FeedBot";

  const payload: Payload = {
    as_user: false,
    text,
    username: chosenName.slice(0, 80),
    icon_url: feedImg.length ? feedImg : await getFeedImg(rssFeed),
    unfurl_links: unfurl,
    unfurl_media: unfurl,
    blocks,
  };

  core.debug(JSON.stringify(payload));
  return payload;
};

export { genPayload };
