interface RssFeedItem extends Record {
  [index?: string]: string | undefined;
  title?: string;
  description?: string;
  link?: string;
  published?: number;
  created?: number;
  category?: string[];
  enclosures?: unknown[];
  media?: unknown;
}

interface RssFeed {
  title?: string;
  description?: string;
  link?: string;
  image?: string;
  category?: string[];
  items?: RssFeedItem[];
}

interface Icon {
  src?: string;
  type?: string;
  sizes?: string;
}

interface Icons {
  domain?: string;
  icons?: Icon[];
}

interface Block {
  type?: string;
  text?: string | Block;
}

interface BlockOfBlocks {
  [index?: number]: Block | null;
}

/* eslint-disable camelcase */
interface Payload {
  as_user?: boolean;
  username?: string;
  icon_url?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  blocks?: BlockOfBlocks[];
}
/* eslint-enable camelcase */

export { RssFeed, RssFeedItem, Icons, Icon, Payload, Block, BlockOfBlocks };
