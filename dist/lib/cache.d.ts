import type { RssFeed, RssFeedItem } from '../types.d';
declare class CacheRecord {
    [index: string]: string | number | undefined;
    title?: string;
    date?: string | number;
    constructor(title?: string, date?: number | string);
}
declare const readCache: (rssFeed: string, cacheDir: string) => Promise<string[]>;
declare const checkCache: (rss: RssFeed, cached: string[]) => Promise<RssFeedItem[]>;
declare const writeCache: (rssFeed: string, cacheDir: string, filtered: RssFeedItem[], cached: string[]) => Promise<void>;
export { readCache, checkCache, writeCache, CacheRecord };
