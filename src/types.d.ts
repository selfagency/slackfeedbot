interface RssFeedItem extends Record {
  category?: string[];
  created?: number;
  description?: string;
  enclosures?: unknown[];
  link?: string;
  media?: unknown;
  published?: number;
  title?: string;
  [index: string]: string | undefined;
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

/* eslint-disable camelcase */
interface Block {
  accessory?: Block;
  elements?: Block[];
  fields?: Block[];
  image_url?: string;
  text?: string | Block;
  type?: string;
}

interface Payload {
  as_user?: boolean;
  blocks?: Block[];
  icon_url?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
  username?: string;
}

/* eslint-enable camelcase */

export { Block, Icon, Icons, Payload, RssFeed, RssFeedItem };
