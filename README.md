# SlackFeedBot

Push RSS feed updates to Slack via GitHub Actions

![Sample output](https://user-images.githubusercontent.com/2541728/158734324-de6429eb-8a21-4ca2-9959-e8eb673a42e6.png)

## How to use this Action

1. Add the [Incoming Webhooks](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) app to your Slack workspace if you haven't already.
2. Create a new webhook by clicking the `Add to Slack` button.
3. Customize the webhook however you like, then copy the webhook URL.

![Sample configuration](https://user-images.githubusercontent.com/2541728/158685833-7a221c22-c5a9-4221-8e93-0003f89a92a8.png)

4. Create a new workflow in your desired repository (e.g. `.github/workflows/slackfeedbot.yml`) and drop in the follwing, where:

   - `rss`: An RSS feed URL.
   - `slack_webhook`: The URL of your Slack webhook (this can and probably
     should be a repository or organization secret).
   - `cache_dir`: The folder in which you want to cache RSS data to prevent
     publishing duplicates (e.g., `./slackfeedbot-cache`), or alternately...
   - `interval`: The number of minutes between runs of the parent workflow, as
     specified in the `cron` section of the `schedule` workflow trigger (may
     publish duplicates due to post pinning).
   - `unfurl`: Tells Slack to show the [Open Graph](https://ogp.me/) preview.
     Defaults to `false` because it's kind of flaky. Not customizable. Use
     the below settings for customizd display.
   - `show_desc`: Whether to show the post description. Defaults to `true`.
   - `show_img`: Whether to show the post image. Defaults to `true`.
   - `show_date`: Whether to show the post date. Defaults to `true`.
   - `show_link`: Whether to show the Read more link, linking back to the post. Defaults to `true`.

## Examples

### With cache folder

Hashes and caches the post title + creation date to ensure no duplicates are posted.

```
name: SlackFeedBot
on:
  schedule:
    - cron: '*/15 * * * *'
jobs:
  rss-to-slack:
    runs-on: ubuntu-latest
    steps:
      - name: Generate cache key
        uses: actions/github-script@v6
        id: generate-key
        with:
          script: |
            core.setOutput('cache-key', new Date().valueOf())
      - name: Retrieve cache
        uses: actions/cache@v2
        with:
          path: ./slackfeedbot-cache
          key: feed-cache-${{ steps.generate-key.outputs.cache-key }}
          restore-keys: feed-cache-
      - name: NYT
        uses: 'selfagency/slackfeedbot@v1.2.7'
        with:
          rss: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          cache_dir: './slackfeedbot-cache'
```

### With interval

No cache, but maybe duplicates.

```
name: SlackFeedBot
on:
  schedule:
    - cron: '*/15 * * * *'
jobs:
  rss-to-slack:
    runs-on: ubuntu-latest
    steps:
      - name: NYT
        uses: 'selfagency/slackfeedbot@v1.2.7'
        with:
          rss: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          interval: 15
```

### Multiple feeds

```
name: FeedBot
on:
  schedule:
    - cron: '*/15 * * * *'
jobs:
  rss-to-slack:
    runs-on: ubuntu-latest
    steps:
      - name: Generate cache key
        uses: actions/github-script@v6
        id: generate-key
        with:
          script: |
            core.setOutput('cache-key', new Date().valueOf())
      - name: Retrieve cache
        uses: actions/cache@v2
        with:
          path: ./slackfeedbot-cache
          key: feed-cache-${{ steps.generate-key.outputs.cache-key }}
          restore-keys: feed-cache-
      - name: LAT
        uses: 'selfagency/slackfeedbot@v1.2.7'
        with:
          rss: 'https://www.latimes.com/rss2.0.xml'
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          cache_dir: './slackfeedbot-cache'
      - name: WaPo
        uses: 'selfagency/slackfeedbot@v1.2.7'
        with:
          rss: 'https://feeds.washingtonpost.com/rss/homepage'
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          cache_dir: './slackfeedbot-cache'
```
