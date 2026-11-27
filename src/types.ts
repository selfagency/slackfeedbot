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

export type { Block, Icons, Payload, RssFeed, RssFeedItem };
