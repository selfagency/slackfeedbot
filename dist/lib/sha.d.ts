import { CacheRecord } from './cache';
declare const digest: (obj: CacheRecord, algorithm?: string) => Promise<string>;
export default digest;
