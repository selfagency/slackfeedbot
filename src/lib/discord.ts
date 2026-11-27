import type {
  DiscordEmbed,
  DiscordPayload,
  RssFeed,
  RssFeedItem,
} from "../types.ts";
import { htmlToMrkdwn, plainTitle } from "./markdown.ts";

const MAX_EMBEDS_PER_MESSAGE = 10;
const MAX_MESSAGE_CHARS = 6000;
const MAX_EMBED_DESCRIPTION = 4096;
const MAX_EMBED_TITLE = 256;
const ELLIPSIS = "…";

const clamp = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, max - 1)}${ELLIPSIS}` : text;

const embedChars = (embed: DiscordEmbed): number =>
  (embed.title?.length ?? 0) + (embed.description?.length ?? 0);

export interface DiscordRenderOptions {
  feedImg: string;
  feedName: string;
  showDate: boolean;
  showDesc: boolean;
  showImg: boolean;
  unfurl: boolean;
}

// Builds Discord webhook payloads: one embed per item, chunked to Discord's
// 10-embed / 6000-character message limits. allowed_mentions with an empty
// parse list prevents @everyone/@here/@user pings from untrusted feed text.
const toEmbed = (
  item: RssFeedItem,
  opts: DiscordRenderOptions
): DiscordEmbed => {
  const embed: DiscordEmbed = {};

  if (item.title) {
    embed.title = clamp(plainTitle(item.title), MAX_EMBED_TITLE);
  }

  if (!opts.unfurl && opts.showDesc && item.description) {
    embed.description = clamp(
      htmlToMrkdwn(item.description, "discord"),
      MAX_EMBED_DESCRIPTION
    );
  }

  if (item.link) {
    embed.url = item.link;
  }

  if (
    opts.showDate &&
    !opts.unfurl &&
    item.created !== undefined &&
    item.created > 0
  ) {
    embed.timestamp = new Date(item.created).toISOString();
  }

  if (opts.showImg && !opts.unfurl && item.image) {
    embed.image = { url: item.image };
  }

  return embed;
};

const chunkEmbeds = (embeds: DiscordEmbed[]): DiscordEmbed[][] => {
  const chunks: DiscordEmbed[][] = [];
  let current: DiscordEmbed[] = [];
  let chars = 0;

  for (const embed of embeds) {
    const size = embedChars(embed);
    const wouldExceed =
      current.length >= MAX_EMBEDS_PER_MESSAGE ||
      chars + size > MAX_MESSAGE_CHARS;
    if (wouldExceed && current.length > 0) {
      chunks.push(current);
      current = [];
      chars = 0;
    }
    current.push(embed);
    chars += size;
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
};

const buildDiscordMessages = (
  filtered: RssFeedItem[],
  unfiltered: RssFeed,
  opts: DiscordRenderOptions
): DiscordPayload[] => {
  const embeds = filtered.map((item) => toEmbed(item, opts));
  const username = opts.feedName.length
    ? opts.feedName
    : unfiltered.title
      ? plainTitle(unfiltered.title)
      : "FeedBot";

  const payload: DiscordPayload = {
    username,
    embeds: [],
    allowed_mentions: { parse: [] },
  };
  if (opts.feedImg.length) {
    payload.avatar_url = opts.feedImg;
  }

  return chunkEmbeds(embeds).map((chunk) => ({
    ...payload,
    embeds: chunk,
  }));
};

export { buildDiscordMessages };
