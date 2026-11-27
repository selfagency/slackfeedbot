# SlackFeedBot

Push RSS feed updates to Slack or Discord via GitHub Actions.

![Sample output](https://user-images.githubusercontent.com/2541728/159546371-a1b61c2f-8fc8-40f3-b888-a8ae0e85507f.png)

## What's new in 2.0.0

- Runs on the **Node 24** GitHub Actions runtime (Node 16/20 runtimes are gone from hosted runners).
- **Discord webhook support** alongside Slack — the same feed can target both.
- Delivery failures are now **reported**: a failed Slack/Discord delivery fails the run and the cache is not written, so items are retried on the next scheduled run. Previously broken deliveries failed silently.
- Fully tested (57 unit + integration tests), SHA-pinned CI actions, Dependabot.

## How to use this Action

### Slack

1. Add the [Incoming Webhooks](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) app to your workspace.
2. Create a webhook and copy its URL (`https://hooks.slack.com/services/...`).
3. Build a workflow:

```yaml
name: SlackFeedBot
on:
  schedule:
    - cron: "*/15 * * * *"
jobs:
  rss-to-slack:
    runs-on: ubuntu-latest
    steps:
      - name: NYT
        uses: "selfagency/slackfeedbot@v2.0.0"
        with:
          rss: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          interval: 15
```

### Discord

1. Server Settings → Integrations → Webhooks → New Webhook → copy URL (`https://discord.com/api/webhooks/...`).
2. Build a workflow:

```yaml
name: FeedToDiscord
on:
  schedule:
    - cron: "*/15 * * * *"
jobs:
  rss-to-discord:
    runs-on: ubuntu-latest
    steps:
      - name: NYT
        uses: "selfagency/slackfeedbot@v2.0.0"
        with:
          rss: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
          discord_webhook: ${{ secrets.DISCORD_WEBHOOK }}
          interval: 15
        continue-on-error: true
```

Messages are rendered as embeds. `allowed_mentions` is set to `{ parse: [] }`, so feed content can never ping `@everyone`/`@here`/users; more than 10 (or >6000-character) embeds are chunked into multiple messages, and 429s honor `Retry-After`.

### Both targets (recommended: with cache)

```yaml
name: FeedBot
on:
  schedule:
    - cron: "*/15 * * * *"
jobs:
  feed:
    runs-on: ubuntu-latest
    steps:
      - name: Generate cache key
        uses: actions/github-script@v7
        id: generate-key
        with:
          script: |
            core.setOutput('cache-key', new Date().valueOf())
      - name: Retrieve cache
        uses: actions/cache@v4
        with:
          path: ./slackfeedbot-cache
          key: feed-cache-${{ steps.generate-key.outputs.cache-key }}
          restore-keys: feed-cache-
      - name: NYT
        uses: "selfagency/slackfeedbot@v2.0.0"
        with:
          rss: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml"
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          discord_webhook: ${{ secrets.DISCORD_WEBHOOK }}
          cache_dir: "./slackfeedbot-cache"
```

`slack_webhook` and `discord_webhook` are both optional but at least one must be set. When both are configured, the cache is written only if every delivery succeeded — so a failing webhook retries the same items next run instead of losing them.

## Options

Required fields denoted with `*`. Specify `cache_dir` (with [actions/cache](https://github.com/actions/cache)) _or_ `interval`.

- `rss`*: The RSS feed URL.
- `feed_name`: A title to override the feed's own title (used as the Slack username / Discord webhook name).
- `feed_image`: An image URL to override the feed's icon (Slack icon / Discord avatar).
- `slack_webhook`: Slack Incoming Webhook URL (must be https; use a repository or organization secret).
- `discord_webhook`: Discord webhook URL (must match `https://discord.com/api/webhooks/...`; use a secret).
- `cache_dir`\* (or `interval`\*): Folder to cache published-item hashes (prevents duplicates).
- `interval`\* (or `cache_dir`\*): Minutes between workflow runs; items newer than this are posted (may duplicate).
- `unfurl`: Skip custom formatting and let the platform render the link itself. Incompatible with the `show_*` options.
- `show_desc`: Show a readable version of the post description. Defaults to `true`.
- `show_img`: Show an image from the item (iTunes art or an image enclosure). Defaults to `true`.
- `show_date`: Show the post date. Defaults to `true` (rendered in UTC).
- `show_link`: Show a Read more link back to the post. Defaults to `true`.

Notes:

- In cache mode, only items published within the last hour are considered, even on older caches.
- Node 24 is incompatible with macOS ≤13.4 self-hosted runners and ARM32 hosted support ended in 2026 — the action targets GitHub-hosted Linux runners.

## Development

- Node 24 (`nvm use`, `.nvmrc`), `npm install` (installs husky hooks).
- `npm run lint` — typecheck (tsc) + biome/ultracite lint/format check.
- `npm test` — vitest unit + integration suite (local fixture servers only; no network).
- `npm run build` — esbuild bundle → `dist/index.cjs` (committed; the Actions runtime executes it).
- See `AGENTS.md` for agent-oriented details on the pipeline, tests, and release mechanics.

## License

MIT — see `LICENSE.txt`.
