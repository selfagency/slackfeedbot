# SlackFeedBot

Push RSS feed updates to Slack via GitHub Actions

![Sample output](https://user-images.githubusercontent.com/2541728/158734324-de6429eb-8a21-4ca2-9959-e8eb673a42e6.png)

## How to use this Action

1. Add the [Incoming Webhooks](https://slack.com/apps/A0F7XDUAZ-incoming-webhooks) app to your Slack workspace if you haven't already.
2. Create a new webhook by clicking the `Add to Slack` button.
3. Customize the webhook however you like, then copy the webhook URL.

![Sample configuration](https://user-images.githubusercontent.com/2541728/158685833-7a221c22-c5a9-4221-8e93-0003f89a92a8.png)

4. Create a new workflow in your desired repository (e.g. `.github/workflows/slackfeedbot.yml`) and drop in the follwing, where:

   - `rss` is an RSS feed URL.
   - `slack_webhook` is the URL of your Slack webhook (this can and probably
     should be a repository or organization secret).
   - `interval` is the number of minutes between runs of the parent workflow, as
     specified in the `cron` section of the `schedule` workflow trigger.
   - `unfurl` tells Slack to show the [Open Graph](https://ogp.me/) preview. If
     set to `false` the title, date, short description, and a link to the feed item
     will be posted. Defaults to `false` because it's kind of flaky.

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
        uses: 'selfagency/slackfeedbot@v1'
        with:
          rss: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml'
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          interval: 15
          unfurl: true
      - name: LAT
        uses: 'selfagency/slackfeedbot@v1'
        with:
          rss: 'https://www.latimes.com/rss2.0.xml'
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          interval: 15
      - name: WaPo
        uses: 'selfagency/slackfeedbot@v1'
        with:
          rss: 'https://feeds.washingtonpost.com/rss/homepage'
          slack_webhook: ${{ secrets.SLACK_WEBHOOK }}
          interval: 15
```
