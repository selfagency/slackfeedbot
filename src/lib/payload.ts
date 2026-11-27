import * as core from "@actions/core";
import dayjs from "dayjs";
import { compile } from "html-to-text";
import { parseHTML } from "linkedom";
import type {
  Block,
  BlockText,
  Payload,
  RssFeed,
  RssFeedItem,
} from "../types.ts";
import { getFeedImg } from "./feedimg.ts";

const html2txt = compile({
  wordwrap: 255,
});

const isElement = (node: Node): node is Element => node.nodeType === 1; // ELEMENT_NODE

const convertChildren = (node: Node | null | undefined): string =>
  Array.from(node?.childNodes ?? [])
    .map(convertNode)
    .join("");

// Converts HTML to Slack mrkdwn: links, emphasis, bullets, and line breaks
const convertNode = (node: Node): string => {
  if (node.nodeType === 3) {
    return node.textContent ?? ""; // TEXT_NODE
  }
  if (!isElement(node)) {
    return "";
  }

  const inner = convertChildren(node);
  switch (node.tagName.toLowerCase()) {
    case "a": {
      const href = node.getAttribute("href");
      return href ? `<${href}|${inner}>` : inner;
    }
    case "strong":
    case "b":
      return `*${inner}*`;
    case "em":
    case "i":
      return `_${inner}_`;
    case "li":
      return `• ${inner}\n`;
    case "p":
    case "div":
      return `${inner}\n`;
    case "br":
      return "\n";
    default:
      return inner;
  }
};

const htmlToMrkdwn = (html: string): string =>
  convertChildren(parseHTML(`<div>${html}</div>`).document.querySelector("div"))
    .replace(/[ \t]+/gu, " ")
    .replace(/\*{2,}/gu, "*")
    .replace(/_{2,}/gu, "_")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();

// Generates the payload to publish to Slack
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
  filtered.forEach((item) => {
    let text = "";

    if (!unfurl && item.description) {
      text += htmlToMrkdwn(item.description);
    }

    if (item.title) {
      blocks.push({
        type: "header",
        text: { type: "plain_text", text: html2txt(item.title) },
      });
    }

    if (unfurl) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${item.link}|Read more>`,
        },
      });
    } else {
      const fields: BlockText[] = [];

      if (showLink) {
        fields.push({
          type: "mrkdwn",
          text: `<${item.link}|Read more>`,
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
              text: `Published ${dayjs(item.created).format("MMM D @ h:mma")} UTC`,
            },
          ],
        });
      }
    }
  });

  const payload: Payload = {
    as_user: false,
    username: feedName.length
      ? feedName
      : unfiltered.title
        ? html2txt(unfiltered.title)
        : "FeedBot",
    icon_url: feedImg.length ? feedImg : await getFeedImg(rssFeed),
    unfurl_links: unfurl,
    unfurl_media: unfurl,
    blocks,
  };

  core.debug(JSON.stringify(payload));
  return payload;
};

export { genPayload };
