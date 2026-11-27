interface RssFeedItem {
  category?: string[];
  created?: number;
  description?: string;
  enclosures?: unknown[];
  image?: string;
  link?: string;
  media?: unknown;
  published?: number;
  title?: string;
}

interface RssFeed {
  category?: string[];
  description?: string;
  image?: string;
  items?: RssFeedItem[];
  link?: string;
  title?: string;
}

interface Icon {
  sizes?: string;
  src?: string;
  type?: string;
}

interface Icons {
  domain?: string;
  icons?: Icon[];
}

interface BlockText {
  text: string;
  type: "plain_text" | "mrkdwn";
}

interface Block {
  accessory?: Block;
  elements?: BlockText[];
  fields?: BlockText[];
  image_url?: string;
  text?: BlockText;
  type?: string;
}

interface Payload {
  as_user?: boolean;
  blocks: Block[];
  icon_url?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  username?: string;
}

interface DiscordEmbed {
  description?: string;
  footer?: { text: string };
  image?: { url: string };
  timestamp?: string;
  title?: string;
  url?: string;
}

interface DiscordPayload {
  allowed_mentions: { parse: string[] };
  avatar_url?: string;
  content?: string;
  embeds: DiscordEmbed[];
  username?: string;
}

type DeliveryPlatform = "slack" | "discord";

interface DeliverResult {
  body: string;
  ok: boolean;
  platform: DeliveryPlatform;
  status: number;
}

export type {
  Block,
  BlockText,
  DeliverResult,
  DeliveryPlatform,
  DiscordEmbed,
  DiscordPayload,
  Icons,
  Payload,
  RssFeed,
  RssFeedItem,
};
