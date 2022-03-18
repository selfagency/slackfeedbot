import core from '@actions/core';

// Validate inputs
const validate = (): void => {
  core.debug(`Validating inputs…`);

  core.debug(
    JSON.stringify({
      slackWebhook: core.getInput('slack_webhook'),
      rssFeed: core.getInput('rss'),
      cacheDir: core.getInput('cache_dir'),
      interval: core.getInput('interval'),
      unfurl: core.getInput('unfurl'),
      showDesc: core.getInput('show_desc'),
      showLink: core.getInput('show_link'),
      showDate: core.getInput('show_date')
    })
  );

  if (!core.getInput('rss') || !core.getInput('rss').startsWith('http')) {
    throw new Error('No feed or invalid feed specified');
  }

  if (!core.getInput('slack_webhook') || !core.getInput('slack_webhook').startsWith('https')) {
    throw new Error('No Slack webhook or invalid webhook specified');
  }

  if (!core.getInput('interval') && !core.getInput('cache_dir')) {
    throw new Error('No interval or cache folder specified');
  }

  if (core.getInput('interval') && parseInt(core.getInput('interval')).toString() === 'NaN') {
    throw new Error('Invalid interval specified');
  }

  if (
    core.getInput('unfurl').length &&
    core.getBooleanInput('unfurl') &&
    (core.getInput('show_desc').length || core.getInput('show_link').length || core.getInput('show_date').length)
  ) {
    throw new Error('Unfurled links cannot be styled with `show` options');
  }
};

export { validate };
