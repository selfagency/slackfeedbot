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
import { writeCache } from './lib/cache';
import { getFeed } from './lib/getfeed';
import { genPayload } from './lib/payload';
import { slack } from './lib/slack';
import { validate } from './lib/validate';
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // validate inputs
        validate();
        // parse inputs
        const slackWebhook = core.getInput('slack_webhook');
        const rssFeed = core.getInput('rss');
        const cacheDir = core.getInput('cache_dir');
        const interval = core.getInput('interval') ? parseInt(core.getInput('interval')) : undefined;
        let unfurl = false;
        try {
            unfurl = core.getBooleanInput('unfurl');
        }
        catch (err) {
            core.debug(err.message);
        }
        // get rss feed items
        const { filtered, unfiltered, cached } = yield getFeed(rssFeed, cacheDir, interval);
        if (filtered.length) {
            // generate payload
            const payload = yield genPayload(filtered, unfiltered, rssFeed, unfurl);
            // send payload to slack
            yield slack(payload, slackWebhook);
            // cache data
            if (cacheDir)
                yield writeCache(rssFeed, cacheDir, filtered, cached);
        }
        else {
            core.info(`No new items found`);
        }
    }
    catch (err) {
        core.debug('Operation failed due to error');
        core.setFailed(err.message);
    }
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield run();
}))();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2FjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLElBQUksTUFBTSxlQUFlLENBQUM7QUFDakMsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUN6QyxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ3hDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDM0MsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNwQyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFFMUMsTUFBTSxHQUFHLEdBQUcsR0FBUyxFQUFFO0lBQ3JCLElBQUk7UUFDRixrQkFBa0I7UUFDbEIsUUFBUSxFQUFFLENBQUM7UUFFWCxlQUFlO1FBQ2YsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUNwRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3JDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDNUMsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1FBQzdGLElBQUksTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJO1lBQ0YsTUFBTSxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDekM7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUNaLElBQUksQ0FBQyxLQUFLLENBQVMsR0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ2xDO1FBRUQscUJBQXFCO1FBQ3JCLE1BQU0sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxHQUFHLE1BQU0sT0FBTyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFcEYsSUFBSSxRQUFRLENBQUMsTUFBTSxFQUFFO1lBQ25CLG1CQUFtQjtZQUNuQixNQUFNLE9BQU8sR0FBRyxNQUFNLFVBQVUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztZQUV4RSx3QkFBd0I7WUFDeEIsTUFBTSxLQUFLLENBQUMsT0FBTyxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBRW5DLGFBQWE7WUFDYixJQUFJLFFBQVE7Z0JBQUUsTUFBTSxVQUFVLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7U0FDckU7YUFBTTtZQUNMLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQztTQUNqQztLQUNGO0lBQUMsT0FBTyxHQUFHLEVBQUU7UUFDWixJQUFJLENBQUMsS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLFNBQVMsQ0FBUyxHQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDdEM7QUFDSCxDQUFDLENBQUEsQ0FBQztBQUVGLENBQUMsR0FBUyxFQUFFO0lBQ1YsTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNkLENBQUMsQ0FBQSxDQUFDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBjb3JlIGZyb20gJ0BhY3Rpb25zL2NvcmUnO1xuaW1wb3J0IHsgd3JpdGVDYWNoZSB9IGZyb20gJy4vbGliL2NhY2hlJztcbmltcG9ydCB7IGdldEZlZWQgfSBmcm9tICcuL2xpYi9nZXRmZWVkJztcbmltcG9ydCB7IGdlblBheWxvYWQgfSBmcm9tICcuL2xpYi9wYXlsb2FkJztcbmltcG9ydCB7IHNsYWNrIH0gZnJvbSAnLi9saWIvc2xhY2snO1xuaW1wb3J0IHsgdmFsaWRhdGUgfSBmcm9tICcuL2xpYi92YWxpZGF0ZSc7XG5cbmNvbnN0IHJ1biA9IGFzeW5jICgpID0+IHtcbiAgdHJ5IHtcbiAgICAvLyB2YWxpZGF0ZSBpbnB1dHNcbiAgICB2YWxpZGF0ZSgpO1xuXG4gICAgLy8gcGFyc2UgaW5wdXRzXG4gICAgY29uc3Qgc2xhY2tXZWJob29rID0gY29yZS5nZXRJbnB1dCgnc2xhY2tfd2ViaG9vaycpO1xuICAgIGNvbnN0IHJzc0ZlZWQgPSBjb3JlLmdldElucHV0KCdyc3MnKTtcbiAgICBjb25zdCBjYWNoZURpciA9IGNvcmUuZ2V0SW5wdXQoJ2NhY2hlX2RpcicpO1xuICAgIGNvbnN0IGludGVydmFsID0gY29yZS5nZXRJbnB1dCgnaW50ZXJ2YWwnKSA/IHBhcnNlSW50KGNvcmUuZ2V0SW5wdXQoJ2ludGVydmFsJykpIDogdW5kZWZpbmVkO1xuICAgIGxldCB1bmZ1cmwgPSBmYWxzZTtcbiAgICB0cnkge1xuICAgICAgdW5mdXJsID0gY29yZS5nZXRCb29sZWFuSW5wdXQoJ3VuZnVybCcpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgY29yZS5kZWJ1ZygoPEVycm9yPmVycikubWVzc2FnZSk7XG4gICAgfVxuXG4gICAgLy8gZ2V0IHJzcyBmZWVkIGl0ZW1zXG4gICAgY29uc3QgeyBmaWx0ZXJlZCwgdW5maWx0ZXJlZCwgY2FjaGVkIH0gPSBhd2FpdCBnZXRGZWVkKHJzc0ZlZWQsIGNhY2hlRGlyLCBpbnRlcnZhbCk7XG5cbiAgICBpZiAoZmlsdGVyZWQubGVuZ3RoKSB7XG4gICAgICAvLyBnZW5lcmF0ZSBwYXlsb2FkXG4gICAgICBjb25zdCBwYXlsb2FkID0gYXdhaXQgZ2VuUGF5bG9hZChmaWx0ZXJlZCwgdW5maWx0ZXJlZCwgcnNzRmVlZCwgdW5mdXJsKTtcblxuICAgICAgLy8gc2VuZCBwYXlsb2FkIHRvIHNsYWNrXG4gICAgICBhd2FpdCBzbGFjayhwYXlsb2FkLCBzbGFja1dlYmhvb2spO1xuXG4gICAgICAvLyBjYWNoZSBkYXRhXG4gICAgICBpZiAoY2FjaGVEaXIpIGF3YWl0IHdyaXRlQ2FjaGUocnNzRmVlZCwgY2FjaGVEaXIsIGZpbHRlcmVkLCBjYWNoZWQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb3JlLmluZm8oYE5vIG5ldyBpdGVtcyBmb3VuZGApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29yZS5kZWJ1ZygnT3BlcmF0aW9uIGZhaWxlZCBkdWUgdG8gZXJyb3InKTtcbiAgICBjb3JlLnNldEZhaWxlZCgoPEVycm9yPmVycikubWVzc2FnZSk7XG4gIH1cbn07XG5cbihhc3luYyAoKSA9PiB7XG4gIGF3YWl0IHJ1bigpO1xufSkoKTtcbiJdfQ==