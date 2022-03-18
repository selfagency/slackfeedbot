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
import dayjs from 'dayjs';
import parse from 'rss-to-json';
import { checkCache, readCache } from './cache';
const getFeed = (rssFeed, cacheDir, interval) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    core.debug(`Retrieving ${rssFeed}…`);
    const rss = yield parse(rssFeed, {});
    core.debug(`Feed has ${(_a = rss === null || rss === void 0 ? void 0 : rss.items) === null || _a === void 0 ? void 0 : _a.length} items`);
    if ((_b = rss === null || rss === void 0 ? void 0 : rss.items) === null || _b === void 0 ? void 0 : _b.length) {
        let toSend = [];
        let cached = [];
        if (cacheDir) {
            core.debug(`Retrieving previously cached entries…`);
            try {
                cached = yield readCache(rssFeed, cacheDir);
                toSend = yield checkCache(rss, cached);
            }
            catch (err) {
                core.debug(err.message);
                toSend = rss.items.filter(item => {
                    return dayjs(item.created).isAfter(dayjs().subtract(60, 'minute'));
                });
            }
        }
        else if (interval) {
            core.debug(`Selecting items posted in the last ${interval} minutes…`);
            toSend = rss.items.filter(item => {
                return dayjs(item.created).isAfter(dayjs().subtract(interval, 'minute'));
            });
        }
        return { filtered: toSend, unfiltered: rss, cached: cached };
    }
    else {
        throw new Error('No feed items found');
    }
});
export { getFeed };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0ZmVlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZ2V0ZmVlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLElBQUksTUFBTSxlQUFlLENBQUM7QUFDakMsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBQzFCLE9BQU8sS0FBSyxNQUFNLGFBQWEsQ0FBQztBQUVoQyxPQUFPLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUVoRCxNQUFNLE9BQU8sR0FBRyxDQUNkLE9BQWUsRUFDZixRQUE0QixFQUM1QixRQUE0QixFQUNpRCxFQUFFOztJQUMvRSxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsT0FBTyxHQUFHLENBQUMsQ0FBQztJQUNyQyxNQUFNLEdBQUcsR0FBWSxNQUFNLEtBQUssQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDOUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLE1BQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLEtBQUssMENBQUUsTUFBTSxRQUFRLENBQUMsQ0FBQztJQUVuRCxJQUFJLE1BQUEsR0FBRyxhQUFILEdBQUcsdUJBQUgsR0FBRyxDQUFFLEtBQUssMENBQUUsTUFBTSxFQUFFO1FBQ3RCLElBQUksTUFBTSxHQUFrQixFQUFFLENBQUM7UUFDL0IsSUFBSSxNQUFNLEdBQWEsRUFBRSxDQUFDO1FBQzFCLElBQUksUUFBUSxFQUFFO1lBQ1osSUFBSSxDQUFDLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1lBQ3BELElBQUk7Z0JBQ0YsTUFBTSxHQUFHLE1BQU0sU0FBUyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztnQkFDNUMsTUFBTSxHQUFHLE1BQU0sVUFBVSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQzthQUN4QztZQUFDLE9BQU8sR0FBRyxFQUFFO2dCQUNaLElBQUksQ0FBQyxLQUFLLENBQVMsR0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUNqQyxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7b0JBQy9CLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUNyRSxDQUFDLENBQUMsQ0FBQzthQUNKO1NBQ0Y7YUFBTSxJQUFJLFFBQVEsRUFBRTtZQUNuQixJQUFJLENBQUMsS0FBSyxDQUFDLHNDQUFzQyxRQUFRLFdBQVcsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDL0IsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7WUFDM0UsQ0FBQyxDQUFDLENBQUM7U0FDSjtRQUVELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDO0tBQzlEO1NBQU07UUFDTCxNQUFNLElBQUksS0FBSyxDQUFDLHFCQUFxQixDQUFDLENBQUM7S0FDeEM7QUFDSCxDQUFDLENBQUEsQ0FBQztBQUVGLE9BQU8sRUFBRSxPQUFPLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjb3JlIGZyb20gJ0BhY3Rpb25zL2NvcmUnO1xuaW1wb3J0IGRheWpzIGZyb20gJ2RheWpzJztcbmltcG9ydCBwYXJzZSBmcm9tICdyc3MtdG8tanNvbic7XG5pbXBvcnQgeyBSc3NGZWVkLCBSc3NGZWVkSXRlbSB9IGZyb20gJy4uL3R5cGVzLmQnO1xuaW1wb3J0IHsgY2hlY2tDYWNoZSwgcmVhZENhY2hlIH0gZnJvbSAnLi9jYWNoZSc7XG5cbmNvbnN0IGdldEZlZWQgPSBhc3luYyAoXG4gIHJzc0ZlZWQ6IHN0cmluZyxcbiAgY2FjaGVEaXI6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgaW50ZXJ2YWw6IG51bWJlciB8IHVuZGVmaW5lZFxuKTogUHJvbWlzZTx7IGZpbHRlcmVkOiBSc3NGZWVkSXRlbVtdOyB1bmZpbHRlcmVkOiBSc3NGZWVkOyBjYWNoZWQ6IHN0cmluZ1tdIH0+ID0+IHtcbiAgY29yZS5kZWJ1ZyhgUmV0cmlldmluZyAke3Jzc0ZlZWR94oCmYCk7XG4gIGNvbnN0IHJzczogUnNzRmVlZCA9IGF3YWl0IHBhcnNlKHJzc0ZlZWQsIHt9KTtcbiAgY29yZS5kZWJ1ZyhgRmVlZCBoYXMgJHtyc3M/Lml0ZW1zPy5sZW5ndGh9IGl0ZW1zYCk7XG5cbiAgaWYgKHJzcz8uaXRlbXM/Lmxlbmd0aCkge1xuICAgIGxldCB0b1NlbmQ6IFJzc0ZlZWRJdGVtW10gPSBbXTtcbiAgICBsZXQgY2FjaGVkOiBzdHJpbmdbXSA9IFtdO1xuICAgIGlmIChjYWNoZURpcikge1xuICAgICAgY29yZS5kZWJ1ZyhgUmV0cmlldmluZyBwcmV2aW91c2x5IGNhY2hlZCBlbnRyaWVz4oCmYCk7XG4gICAgICB0cnkge1xuICAgICAgICBjYWNoZWQgPSBhd2FpdCByZWFkQ2FjaGUocnNzRmVlZCwgY2FjaGVEaXIpO1xuICAgICAgICB0b1NlbmQgPSBhd2FpdCBjaGVja0NhY2hlKHJzcywgY2FjaGVkKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb3JlLmRlYnVnKCg8RXJyb3I+ZXJyKS5tZXNzYWdlKTtcbiAgICAgICAgdG9TZW5kID0gcnNzLml0ZW1zLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgICByZXR1cm4gZGF5anMoaXRlbS5jcmVhdGVkKS5pc0FmdGVyKGRheWpzKCkuc3VidHJhY3QoNjAsICdtaW51dGUnKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaW50ZXJ2YWwpIHtcbiAgICAgIGNvcmUuZGVidWcoYFNlbGVjdGluZyBpdGVtcyBwb3N0ZWQgaW4gdGhlIGxhc3QgJHtpbnRlcnZhbH0gbWludXRlc+KApmApO1xuICAgICAgdG9TZW5kID0gcnNzLml0ZW1zLmZpbHRlcihpdGVtID0+IHtcbiAgICAgICAgcmV0dXJuIGRheWpzKGl0ZW0uY3JlYXRlZCkuaXNBZnRlcihkYXlqcygpLnN1YnRyYWN0KGludGVydmFsLCAnbWludXRlJykpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgZmlsdGVyZWQ6IHRvU2VuZCwgdW5maWx0ZXJlZDogcnNzLCBjYWNoZWQ6IGNhY2hlZCB9O1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignTm8gZmVlZCBpdGVtcyBmb3VuZCcpO1xuICB9XG59O1xuXG5leHBvcnQgeyBnZXRGZWVkIH07XG4iXX0=