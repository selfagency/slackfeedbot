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
import { compile } from 'html-to-text';
import { parseHTML } from 'linkedom';
import showdown from 'showdown';
import { getFeedImg } from './feedimg.js';
const converter = new showdown.Converter();
const html2txt = compile({
    wordwrap: 120
});
const genPayload = (filtered, unfiltered, rssFeed, unfurl) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const blocks = filtered.map(item => {
            let text = '';
            if (!unfurl) {
                if (item.title)
                    text += `*${html2txt(item.title)}*\n`;
                if (item.description) {
                    core.debug(`Item description: ${item.description}`);
                    const { document } = parseHTML('<div></div>');
                    const markdown = converter.makeMarkdown(item.description, document);
                    text += `${markdown.replace(/[Rr]ead more/g, '…').replace(/\n/g, ' ')}\n`;
                }
                if (item.link)
                    text += `<${item.link}|Read more>`;
            }
            else {
                if (item.title)
                    text += `<${item.link}|${html2txt(item.title + item.created)}>`;
            }
            return {
                type: 'section',
                text: {
                    type: 'mrkdwn',
                    text
                }
            };
        });
        const payload = {
            as_user: false,
            username: unfiltered.title ? html2txt(unfiltered.title) : 'FeedBot',
            icon_url: yield getFeedImg(rssFeed),
            unfurl_links: unfurl,
            unfurl_media: unfurl,
            blocks
        };
        return payload;
    }
    catch (err) {
        core.debug(err.message);
        throw new Error('Failed to generated Slack payload');
    }
});
export { genPayload };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGF5bG9hZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9saWIvcGF5bG9hZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxPQUFPLElBQUksTUFBTSxlQUFlLENBQUM7QUFDakMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUN2QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ3JDLE9BQU8sUUFBUSxNQUFNLFVBQVUsQ0FBQztBQUVoQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBRTFDLE1BQU0sU0FBUyxHQUFHLElBQUksUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQzNDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQztJQUN2QixRQUFRLEVBQUUsR0FBRztDQUNkLENBQUMsQ0FBQztBQUVILE1BQU0sVUFBVSxHQUFHLENBQ2pCLFFBQXVCLEVBQ3ZCLFVBQW1CLEVBQ25CLE9BQWUsRUFDZixNQUFlLEVBQ0csRUFBRTtJQUNwQixJQUFJO1FBQ0YsTUFBTSxNQUFNLEdBQVksUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMxQyxJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7WUFFZCxJQUFJLENBQUMsTUFBTSxFQUFFO2dCQUNYLElBQUksSUFBSSxDQUFDLEtBQUs7b0JBQUUsSUFBSSxJQUFJLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO2dCQUN0RCxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUU7b0JBQ3BCLElBQUksQ0FBQyxLQUFLLENBQUMscUJBQXFCLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO29CQUNwRCxNQUFNLEVBQUUsUUFBUSxFQUFFLEdBQUcsU0FBUyxDQUFDLGFBQWEsQ0FBQyxDQUFDO29CQUM5QyxNQUFNLFFBQVEsR0FBRyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ3BFLElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQztpQkFDM0U7Z0JBQ0QsSUFBSSxJQUFJLENBQUMsSUFBSTtvQkFBRSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxhQUFhLENBQUM7YUFDbkQ7aUJBQU07Z0JBQ0wsSUFBSSxJQUFJLENBQUMsS0FBSztvQkFBRSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO2FBQ2pGO1lBRUQsT0FBTztnQkFDTCxJQUFJLEVBQUUsU0FBUztnQkFDZixJQUFJLEVBQUU7b0JBQ0osSUFBSSxFQUFFLFFBQVE7b0JBQ2QsSUFBSTtpQkFDTDthQUNGLENBQUM7UUFDSixDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sT0FBTyxHQUFHO1lBQ2QsT0FBTyxFQUFFLEtBQUs7WUFDZCxRQUFRLEVBQUUsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUztZQUNuRSxRQUFRLEVBQUUsTUFBTSxVQUFVLENBQUMsT0FBTyxDQUFDO1lBQ25DLFlBQVksRUFBRSxNQUFNO1lBQ3BCLFlBQVksRUFBRSxNQUFNO1lBQ3BCLE1BQU07U0FDUCxDQUFDO1FBRUYsT0FBTyxPQUFPLENBQUM7S0FDaEI7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLElBQUksQ0FBQyxLQUFLLENBQVMsR0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sSUFBSSxLQUFLLENBQUMsbUNBQW1DLENBQUMsQ0FBQztLQUN0RDtBQUNILENBQUMsQ0FBQSxDQUFDO0FBRUYsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNvcmUgZnJvbSAnQGFjdGlvbnMvY29yZSc7XG5pbXBvcnQgeyBjb21waWxlIH0gZnJvbSAnaHRtbC10by10ZXh0JztcbmltcG9ydCB7IHBhcnNlSFRNTCB9IGZyb20gJ2xpbmtlZG9tJztcbmltcG9ydCBzaG93ZG93biBmcm9tICdzaG93ZG93bic7XG5pbXBvcnQgdHlwZSB7IEJsb2NrLCBQYXlsb2FkLCBSc3NGZWVkLCBSc3NGZWVkSXRlbSB9IGZyb20gJy4uL3R5cGVzLmQnO1xuaW1wb3J0IHsgZ2V0RmVlZEltZyB9IGZyb20gJy4vZmVlZGltZy5qcyc7XG5cbmNvbnN0IGNvbnZlcnRlciA9IG5ldyBzaG93ZG93bi5Db252ZXJ0ZXIoKTtcbmNvbnN0IGh0bWwydHh0ID0gY29tcGlsZSh7XG4gIHdvcmR3cmFwOiAxMjBcbn0pO1xuXG5jb25zdCBnZW5QYXlsb2FkID0gYXN5bmMgKFxuICBmaWx0ZXJlZDogUnNzRmVlZEl0ZW1bXSxcbiAgdW5maWx0ZXJlZDogUnNzRmVlZCxcbiAgcnNzRmVlZDogc3RyaW5nLFxuICB1bmZ1cmw6IGJvb2xlYW5cbik6IFByb21pc2U8UGF5bG9hZD4gPT4ge1xuICB0cnkge1xuICAgIGNvbnN0IGJsb2NrczogQmxvY2tbXSA9IGZpbHRlcmVkLm1hcChpdGVtID0+IHtcbiAgICAgIGxldCB0ZXh0ID0gJyc7XG5cbiAgICAgIGlmICghdW5mdXJsKSB7XG4gICAgICAgIGlmIChpdGVtLnRpdGxlKSB0ZXh0ICs9IGAqJHtodG1sMnR4dChpdGVtLnRpdGxlKX0qXFxuYDtcbiAgICAgICAgaWYgKGl0ZW0uZGVzY3JpcHRpb24pIHtcbiAgICAgICAgICBjb3JlLmRlYnVnKGBJdGVtIGRlc2NyaXB0aW9uOiAke2l0ZW0uZGVzY3JpcHRpb259YCk7XG4gICAgICAgICAgY29uc3QgeyBkb2N1bWVudCB9ID0gcGFyc2VIVE1MKCc8ZGl2PjwvZGl2PicpO1xuICAgICAgICAgIGNvbnN0IG1hcmtkb3duID0gY29udmVydGVyLm1ha2VNYXJrZG93bihpdGVtLmRlc2NyaXB0aW9uLCBkb2N1bWVudCk7XG4gICAgICAgICAgdGV4dCArPSBgJHttYXJrZG93bi5yZXBsYWNlKC9bUnJdZWFkIG1vcmUvZywgJ+KApicpLnJlcGxhY2UoL1xcbi9nLCAnICcpfVxcbmA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGl0ZW0ubGluaykgdGV4dCArPSBgPCR7aXRlbS5saW5rfXxSZWFkIG1vcmU+YDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpdGVtLnRpdGxlKSB0ZXh0ICs9IGA8JHtpdGVtLmxpbmt9fCR7aHRtbDJ0eHQoaXRlbS50aXRsZSArIGl0ZW0uY3JlYXRlZCl9PmA7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHR5cGU6ICdzZWN0aW9uJyxcbiAgICAgICAgdGV4dDoge1xuICAgICAgICAgIHR5cGU6ICdtcmtkd24nLFxuICAgICAgICAgIHRleHRcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICBhc191c2VyOiBmYWxzZSxcbiAgICAgIHVzZXJuYW1lOiB1bmZpbHRlcmVkLnRpdGxlID8gaHRtbDJ0eHQodW5maWx0ZXJlZC50aXRsZSkgOiAnRmVlZEJvdCcsXG4gICAgICBpY29uX3VybDogYXdhaXQgZ2V0RmVlZEltZyhyc3NGZWVkKSxcbiAgICAgIHVuZnVybF9saW5rczogdW5mdXJsLFxuICAgICAgdW5mdXJsX21lZGlhOiB1bmZ1cmwsXG4gICAgICBibG9ja3NcbiAgICB9O1xuXG4gICAgcmV0dXJuIHBheWxvYWQ7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvcmUuZGVidWcoKDxFcnJvcj5lcnIpLm1lc3NhZ2UpO1xuICAgIHRocm93IG5ldyBFcnJvcignRmFpbGVkIHRvIGdlbmVyYXRlZCBTbGFjayBwYXlsb2FkJyk7XG4gIH1cbn07XG5cbmV4cG9ydCB7IGdlblBheWxvYWQgfTtcbiJdfQ==