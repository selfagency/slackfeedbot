# SlackFeedBot

Push RSS feed updates to Slack via GitHub Actions

![Sample output](https://user-images.githubusercontent.com/2541728/159546371-a1b61c2f-8fc8-40f3-b888-a8ae0e85507f.png)

## How to use this Action

1. Add the [Incoming Webhooks](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) app to your Slack workspace if you haven't already.
2. Create a new webhook by clicking the `Add to Slack` button.
3. Customize the webhook however you like, then copy the webhook URL.

![Sample configuration](https://user-images.githubusercontent.com/2541728/158685833-7a221c22-c5a9-4221-8e93-0003f89a92a8.png)

4. Create a new workflow in your desired repository (e.g. `.github/workflows/slackfeedbot.yml`) and drop in the follwing:

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
        uses: 'selfagency/slackfeedbot@v1.2.9'
        with:
          rss: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          interval: 15
```

## Options

Required fields denoted with `*`. Must specify `cache_dir` (which requires separate use of [actions/cache](https://github.com/actions/cache) or a similar solution) _or_ `interval`.

- `rss`\*: The RSS feed URL.
- `feed_name`: A title to override the RSS feed's own title.
- `feed_image`: An image to override the RSS feed's default feed image.
- `slack_webhook`\*: The Slack webhook URL (this can and probably should be a repository or organization secret).
- `cache_dir`\*: The folder in which to cache feed data, which prevents publishing duplicates, or _alternately_...
- `interval`\*: The number of minutes between runs of the parent workflow, as specified in the `cron` section of the `schedule` workflow trigger (may publish duplicates due to post pinning).
- `unfurl`: Shows the [Open Graph](https://ogp.me/) preview for RSS items instead of this action's display format. Set to `false` because it's kind of flaky and non-customizable. Use the below settings instead to customize display.
- `show_desc`: Show the post description. Defaults to `true`.
- `show_img`: Show the post image. Defaults to `true`.
- `show_date`: Show the post date. Defaults to `true`.
- `show_link`: Show the Read more link, linking back to the post. Defaults to `true`.

## Examples

### With cache folder (recommended)

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
        uses: 'selfagency/slackfeedbot@v1.2.9'
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
        uses: 'selfagency/slackfeedbot@v1.2.9'
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
      - name: LAT
        uses: 'selfagency/slackfeedbot@v1.2.9'
        with:
          rss: 'https://www.latimes.com/rss2.0.xml'
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          interval: 15
      - name: WaPo
        uses: 'selfagency/slackfeedbot@v1.2.9'
        with:
          rss: 'https://feeds.washingtonpost.com/rss/homepage'
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          interval: 15
```
