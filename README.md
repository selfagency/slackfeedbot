# FeedBot

Push RSS feed updates to Slack via GitHub Actions

## How to use this Action

1. Add the [Incoming Webhooks](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) app to your Slack workspace if you haven't already.
2. Create a new webhook by clicking the `Add to Slack` button.
3. Customize the webhook however you like, then copy the webhook URL.

![Sample configuration](https://user-images.githubusercontent.com/2541728/158685833-7a221c22-c5a9-4221-8e93-0003f89a92a8.png)

4. Create a new workflow in your desired repository (e.g. `.github/workflows/feedbot.yml`) and drop in the follwing, where:

   - `rss` is an array of RSS feed URLs.
   - `slack_webhook` is the URL of your Slack webhook (this can and probably
     should be a repository or organization secret).
   - `interval` is the number of minutes between runs of the parent workflow, as
     specified in the `cron` section of the `schedule` workflow trigger.
   - `unfurl` tells Slack to show the [Open Graph](https://ogp.me/) preview. If
     set to `false` the title, date, short description, and a link to the feed item
     will be posted.

```
name: FeedBot
on:
  schedule:
    cron: '15 * * * *'
jobs:
  rss-to-slack:
    runs-on: ubuntu-latest
    steps:
      - name: FeedBot
        uses: 'selfagency/feedbot@main'
        with:
          rss:
            - 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
            - 'https://www.latimes.com/rss2.0.xml'
            - 'https://feeds.washingtonpost.com/rss/homepage'
          slack_webhook: ${{ secrets.FEEDBOT_WEBHOOK }}
          interval: 15
          unfurl: true
```
