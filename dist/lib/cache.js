var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import core from '@actions/core';
import fs from 'fs';
import { promisify } from 'util';
import digest from './sha';
const read = promisify(fs.readFile);
const write = promisify(fs.writeFile);
const md = promisify(fs.mkdir);
class CacheRecord {
    constructor(title, date) {
        this.title = title;
        this.date = date;
    }
}
const readCache = (rssFeed, cacheDir) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        core.debug(`Retrieving previously published entries…`);
        const rssFeedUrl = new URL(rssFeed);
        const cachePath = `${cacheDir}/${rssFeedUrl.hostname.replace(/\./g, '_')}.json`;
        const cached = JSON.parse(yield read(cachePath, 'utf8'));
        core.debug(`Found ${cached.length} cached items`);
        return cached;
    }
    catch (err) {
        core.debug(err.message);
        return [];
    }
});
const checkCache = (rss, cached) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (rss === null || rss === void 0 ? void 0 : rss.items) {
            const output = [];
            for (const item of rss.items) {
                let cacheHit = false;
                for (const published in cached) {
                    const record = new CacheRecord(item.title, item.created);
                    if (published === (yield digest(record))) {
                        cacheHit = true;
                        core.debug(`Cache hit for ${item.title}`);
                    }
                }
                if (!cacheHit)
                    output.push(item);
            }
            core.debug(`Found ${output.length} new items`);
            return output;
        }
        else {
            core.debug('Nothing to check');
            return [];
        }
    }
    catch (err) {
        core.debug(err.message);
        throw new Error('Error checking cache');
    }
});
const writeCache = (rssFeed, cacheDir, filtered, cached) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const rssFeedUrl = new URL(rssFeed);
        const cachePath = `${cacheDir}/${rssFeedUrl.hostname.replace(/\./g, '_')}.json`;
        core.debug(`Writing cache to ${cachePath}`);
        yield md(cacheDir, { recursive: true });
        const hashed = [...cached];
        for (const sent of filtered) {
            const record = new CacheRecord(sent.title, sent.created);
            hashed.push(yield digest(record));
        }
        yield write(cachePath, JSON.stringify(hashed));
    }
    catch (err) {
        core.debug(err.message);
        throw new Error('Failed to write to cache');
    }
});
export { readCache, checkCache, writeCache, CacheRecord };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2NhY2hlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLE9BQU8sSUFBSSxNQUFNLGVBQWUsQ0FBQztBQUNqQyxPQUFPLEVBQUUsTUFBTSxJQUFJLENBQUM7QUFDcEIsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUVqQyxPQUFPLE1BQU0sTUFBTSxPQUFPLENBQUM7QUFFM0IsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNwQyxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3RDLE1BQU0sRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7QUFFL0IsTUFBTSxXQUFXO0lBS2YsWUFBWSxLQUFjLEVBQUUsSUFBc0I7UUFDaEQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFDbkIsQ0FBQztDQUNGO0FBRUQsTUFBTSxTQUFTLEdBQUcsQ0FBTyxPQUFlLEVBQUUsUUFBZ0IsRUFBcUIsRUFBRTtJQUMvRSxJQUFJO1FBQ0YsSUFBSSxDQUFDLEtBQUssQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO1FBRXZELE1BQU0sVUFBVSxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sU0FBUyxHQUFHLEdBQUcsUUFBUSxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDO1FBQ2hGLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFekQsSUFBSSxDQUFD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TUFBTSxJQUFJLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0tBQzdDO0FBQ0gsQ0FBQyxDQUFBLENBQUM7QUFFRixPQUFPLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY29yZSBmcm9tICdAYWN0aW9ucy9jb3JlJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgeyBwcm9taXNpZnkgfSBmcm9tICd1dGlsJztcbmltcG9ydCB0eXBlIHsgUnNzRmVlZCwgUnNzRmVlZEl0ZW0gfSBmcm9tICcuLi90eXBlcy5kJztcbmltcG9ydCBkaWdlc3QgZnJvbSAnLi9zaGEnO1xuXG5jb25zdCByZWFkID0gcHJvbWlzaWZ5KGZzLnJlYWRGaWxlKTtcbmNvbnN0IHdyaXRlID0gcHJvbWlzaWZ5KGZzLndyaXRlRmlsZSk7XG5jb25zdCBtZCA9IHByb21pc2lmeShmcy5ta2Rpcik7XG5cbmNsYXNzIENhY2hlUmVjb3JkIHtcbiAgW2luZGV4OiBzdHJpbmddOiBzdHJpbmcgfCBudW1iZXIgfCB1bmRlZmluZWQ7XG4gIHRpdGxlPzogc3RyaW5nO1xuICBkYXRlPzogc3RyaW5nIHwgbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKHRpdGxlPzogc3RyaW5nLCBkYXRlPzogbnVtYmVyIHwgc3RyaW5nKSB7XG4gICAgdGhpcy50aXRsZSA9IHRpdGxlO1xuICAgIHRoaXMuZGF0ZSA9IGRhdGU7XG4gIH1cbn1cblxuY29uc3QgcmVhZENhY2hlID0gYXN5bmMgKHJzc0ZlZWQ6IHN0cmluZywgY2FjaGVEaXI6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+ID0+IHtcbiAgdHJ5IHtcbiAgICBjb3JlLmRlYnVnKGBSZXRyaWV2aW5nIHByZXZpb3VzbHkgcHVibGlzaGVkIGVudHJpZXPigKZgKTtcblxuICAgIGNvbnN0IHJzc0ZlZWRVcmwgPSBuZXcgVVJMKHJzc0ZlZWQpO1xuICAgIGNvbnN0IGNhY2hlUGF0aCA9IGAke2NhY2hlRGlyfS8ke3Jzc0ZlZWRVcmwuaG9zdG5hbWUucmVwbGFjZSgvXFwuL2csICdfJyl9Lmpzb25gO1xuICAgIGNvbnN0IGNhY2hlZCA9IEpTT04ucGFyc2UoYXdhaXQgcmVhZChjYWNoZVBhdGgsICd1dGY4JykpO1xuXG4gICAgY29yZS5kZWJ1ZyhgRm91bmQgJHtjYWNoZWQubGVuZ3RofSBjYWNoZWQgaXRlbXNgKTtcbiAgICByZXR1cm4gY2FjaGVkO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb3JlLmRlYnVnKCg8RXJyb3I+ZXJyKS5tZXNzYWdlKTtcbiAgICByZXR1cm4gW107XG4gIH1cbn07XG5cbmNvbnN0IGNoZWNrQ2FjaGUgPSBhc3luYyAocnNzOiBSc3NGZWVkLCBjYWNoZWQ6IHN0cmluZ1tdKTogUHJvbWlzZTxSc3NGZWVkSXRlbVtdPiA9PiB7XG4gIHRyeSB7XG4gICAgaWYgKHJzcz8uaXRlbXMpIHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IFtdO1xuICAgICAgZm9yIChjb25zdCBpdGVtIG9mIHJzcy5pdGVtcykge1xuICAgICAgICBsZXQgY2FjaGVIaXQgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKGNvbnN0IHB1Ymxpc2hlZCBpbiBjYWNoZWQpIHtcbiAgICAgICAgICBjb25zdCByZWNvcmQgPSBuZXcgQ2FjaGVSZWNvcmQoaXRlbS50aXRsZSwgaXRlbS5jcmVhdGVkKTtcbiAgICAgICAgICBpZiAocHVibGlzaGVkID09PSAoYXdhaXQgZGlnZXN0KHJlY29yZCkpKSB7XG4gICAgICAgICAgICBjYWNoZUhpdCA9IHRydWU7XG4gICAgICAgICAgICBjb3JlLmRlYnVnKGBDYWNoZSBoaXQgZm9yICR7aXRlbS50aXRsZX1gKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNhY2hlSGl0KSBvdXRwdXQucHVzaChpdGVtKTtcbiAgICAgIH1cblxuICAgICAgY29yZS5kZWJ1ZyhgRm91bmQgJHtvdXRwdXQubGVuZ3RofSBuZXcgaXRlbXNgKTtcbiAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvcmUuZGVidWcoJ05vdGhpbmcgdG8gY2hlY2snKTtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvcmUuZGVidWcoKDxFcnJvcj5lcnIpLm1lc3NhZ2UpO1xuICAgIHRocm93IG5ldyBFcnJvcignRXJyb3IgY2hlY2tpbmcgY2FjaGUnKTtcbiAgfVxufTtcblxuY29uc3Qgd3JpdGVDYWNoZSA9IGFzeW5jIChcbiAgcnNzRmVlZDogc3RyaW5nLFxuICBjYWNoZURpcjogc3RyaW5nLFxuICBmaWx0ZXJlZDogUnNzRmVlZEl0ZW1bXSxcbiAgY2FjaGVkOiBzdHJpbmdbXVxuKTogUHJvbWlzZTx2b2lkPiA9PiB7XG4gIHRyeSB7XG4gICAgY29uc3QgcnNzRmVlZFVybCA9IG5ldyBVUkwocnNzRmVlZCk7XG4gICAgY29uc3QgY2FjaGVQYXRoID0gYCR7Y2FjaGVEaXJ9LyR7cnNzRmVlZFVybC5ob3N0bmFtZS5yZXBsYWNlKC9cXC4vZywgJ18nKX0uanNvbmA7XG5cbiAgICBjb3JlLmRlYnVnKGBXcml0aW5nIGNhY2hlIHRvICR7Y2FjaGVQYXRofWApO1xuXG4gICAgYXdhaXQgbWQoY2FjaGVEaXIsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuXG4gICAgY29uc3QgaGFzaGVkID0gWy4uLmNhY2hlZF07XG4gICAgZm9yIChjb25zdCBzZW50IG9mIGZpbHRlcmVkKSB7XG4gICAgICBjb25zdCByZWNvcmQgPSBuZXcgQ2FjaGVSZWNvcmQoc2VudC50aXRsZSwgc2VudC5jcmVhdGVkKTtcbiAgICAgIGhhc2hlZC5wdXNoKGF3YWl0IGRpZ2VzdChyZWNvcmQpKTtcbiAgICB9XG5cbiAgICBhd2FpdCB3cml0ZShjYWNoZVBhdGgsIEpTT04uc3RyaW5naWZ5KGhhc2hlZCkpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb3JlLmRlYnVnKCg8RXJyb3I+ZXJyKS5tZXNzYWdlKTtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byB3cml0ZSB0byBjYWNoZScpO1xuICB9XG59O1xuXG5leHBvcnQgeyByZWFkQ2FjaGUsIGNoZWNrQ2FjaGUsIHdyaXRlQ2FjaGUsIENhY2hlUmVjb3JkIH07XG4iXX0=