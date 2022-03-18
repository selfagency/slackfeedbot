import { RssFeed, RssFeedItem } from '../types.d';
declare const getFeed: (rssFeed: string, cacheDir: string | undefined, interval: number | undefined) => Promise<{
    filtered: RssFeedItem[];
    unfiltered: RssFeed;
    cached: string[];
}>;
export { getFeed };
