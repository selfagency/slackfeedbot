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
import fetch from 'node-fetch';
const getFeedImg = (rssFeed) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const url = new URL(rssFeed);
    const host = url.hostname
        .replace('//status.', '//')
        .replace('//feed.', '//')
        .replace('//feeds.', '//')
        .replace('//rss.', '//');
    core.debug(`Getting favicons for ${host}`);
    let favicon;
    try {
        const icons = yield (yield fetch(`https:/favicongrabber.com/api/grab/${host}`)).json();
        core.debug(`Icons: ${JSON.stringify(icons)}`);
        if (icons === null || icons === void 0 ? void 0 : icons.icons) {
            favicon = ((_a = icons.icons.find(i => (i === null || i === void 0 ? void 0 : i.sizes) === '144x144')) === null || _a === void 0 ? void 0 : _a.src) || ((_b = icons.icons[0]) === null || _b === void 0 ? void 0 : _b.src);
            core.debug(`Favicon: ${favicon}`);
        }
    }
    catch (err) {
        core.debug(err.message);
        favicon = undefined;
    }
    return favicon;
});
export { getFeedImg };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVlZGltZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvZmVlZGltZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLElBQUksTUFBTSxlQUFlLENBQUM7QUFDakMsT0FBTyxLQUFLLE1BQU0sWUFBWSxDQUFDO0FBRy9CLE1BQU0sVUFBVSxHQUFHLENBQU8sT0FBZSxFQUErQixFQUFFOztJQUN4RSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM3QixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsUUFBUTtTQUN0QixPQUFPLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQztTQUMxQixPQUFPLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQztTQUN4QixPQUFPLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQztTQUN6QixPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNCLElBQUksQ0FBQyxLQUFLLENBQUMsd0JBQXdCLElBQUksRUFBRSxDQUFDLENBQUM7SUFFM0MsSUFBSSxPQUFPLENBQUM7SUFDWixJQUFJO1FBQ0YsTUFBTSxLQUFLLEdBQVUsTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFDLHNDQUFzQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDOUYsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRTlDLElBQUksS0FBSyxhQUFMLEtBQUssdUJBQUwsS0FBSyxDQUFFLEtBQUssRUFBRTtZQUNoQixPQUFPLEdBQUcsQ0FBQSxNQUFBLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQSxDQUFDLGFBQUQsQ0FBQyx1QkFBRCxDQUFDLENBQUUsS0FBSyxNQUFLLFNBQVMsQ0FBQywwQ0FBRSxHQUFHLE1BQUksTUFBQSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQywwQ0FBRSxHQUFHLENBQUEsQ0FBQztZQUNwRixJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksT0FBTyxFQUFFLENBQUMsQ0FBQztTQUNuQztLQUNGO0lBQUMsT0FBTyxHQUFHLEVBQUU7UUFDWixJQUFJLENBQUMsS0FBSyxDQUFTLEdBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNqQyxPQUFPLEdBQUcsU0FBUyxDQUFDO0tBQ3JCO0lBRUQsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQyxDQUFBLENBQUM7QUFFRixPQUFPLEVBQUUsVUFBVSxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgY29yZSBmcm9tICdAYWN0aW9ucy9jb3JlJztcbmltcG9ydCBmZXRjaCBmcm9tICdub2RlLWZldGNoJztcbmltcG9ydCB0eXBlIHsgSWNvbnMgfSBmcm9tICcuLi90eXBlcy5kJztcblxuY29uc3QgZ2V0RmVlZEltZyA9IGFzeW5jIChyc3NGZWVkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4gPT4ge1xuICBjb25zdCB1cmwgPSBuZXcgVVJMKHJzc0ZlZWQpO1xuICBjb25zdCBob3N0ID0gdXJsLmhvc3RuYW1lXG4gICAgLnJlcGxhY2UoJy8vc3RhdHVzLicsICcvLycpXG4gICAgLnJlcGxhY2UoJy8vZmVlZC4nLCAnLy8nKVxuICAgIC5yZXBsYWNlKCcvL2ZlZWRzLicsICcvLycpXG4gICAgLnJlcGxhY2UoJy8vcnNzLicsICcvLycpO1xuICBjb3JlLmRlYnVnKGBHZXR0aW5nIGZhdmljb25zIGZvciAke2hvc3R9YCk7XG5cbiAgbGV0IGZhdmljb247XG4gIHRyeSB7XG4gICAgY29uc3QgaWNvbnMgPSA8SWNvbnM+YXdhaXQgKGF3YWl0IGZldGNoKGBodHRwczovZmF2aWNvbmdyYWJiZXIuY29tL2FwaS9ncmFiLyR7aG9zdH1gKSkuanNvbigpO1xuICAgIGNvcmUuZGVidWcoYEljb25zOiAke0pTT04uc3RyaW5naWZ5KGljb25zKX1gKTtcblxuICAgIGlmIChpY29ucz8uaWNvbnMpIHtcbiAgICAgIGZhdmljb24gPSBpY29ucy5pY29ucy5maW5kKGkgPT4gaT8uc2l6ZXMgPT09ICcxNDR4MTQ0Jyk/LnNyYyB8fCBpY29ucy5pY29uc1swXT8uc3JjO1xuICAgICAgY29yZS5kZWJ1ZyhgRmF2aWNvbjogJHtmYXZpY29ufWApO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29yZS5kZWJ1ZygoPEVycm9yPmVycikubWVzc2FnZSk7XG4gICAgZmF2aWNvbiA9IHVuZGVmaW5lZDtcbiAgfVxuXG4gIHJldHVybiBmYXZpY29uO1xufTtcblxuZXhwb3J0IHsgZ2V0RmVlZEltZyB9O1xuIl19