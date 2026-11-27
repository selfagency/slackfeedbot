import type { Server } from "node:http";
import { createServer } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { getFeedImg } from "./feedimg.ts";

let server: Server | undefined;
let baseUrl = "";

const startServer = async (status: number, body: string): Promise<void> => {
  server = createServer((req, res) => {
    if (req.url?.startsWith("/api/grab/")) {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(body);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => {
    server?.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
};

afterEach(async () => {
  if (server !== undefined) {
    await new Promise<void>((resolve) => {
      server?.close(() => resolve());
    });
    server = undefined;
  }
});

describe("getFeedImg", () => {
  it("prefers the largest known icon size and strips feed host prefixes", async () => {
    await startServer(
      200,
      JSON.stringify({
        icons: [
          { src: "a.png", sizes: "16x16" },
          { src: "b.png", sizes: "72x72" },
          { src: "c.png", sizes: "180x180" },
        ],
      })
    );
    const favicon = await getFeedImg(
      "https://feeds.example.com/rss.xml",
      baseUrl
    );
    expect(favicon).toBe("c.png");
  });

  it("falls back to the first icon when no preferred size exists", async () => {
    await startServer(
      200,
      JSON.stringify({ icons: [{ src: "first.png", sizes: "16x16" }] })
    );
    const favicon = await getFeedImg("https://example.com/feed.xml", baseUrl);
    expect(favicon).toBe("first.png");
  });

  it("returns undefined when the registry has no icons", async () => {
    await startServer(200, JSON.stringify({ icons: [] }));
    const favicon = await getFeedImg("https://example.com/feed.xml", baseUrl);
    expect(favicon).toBeUndefined();
  });

  it("returns undefined on a server error", async () => {
    await startServer(500, "broken");
    const favicon = await getFeedImg("https://example.com/feed.xml", baseUrl);
    expect(favicon).toBeUndefined();
  });
});
