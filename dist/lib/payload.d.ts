import type { Payload, RssFeed, RssFeedItem } from '../types.d';
declare const genPayload: (filtered: RssFeedItem[], unfiltered: RssFeed, rssFeed: string, unfurl: boolean) => Promise<Payload>;
export { genPayload };
