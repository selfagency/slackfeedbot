import core from '@actions/core';

const validate = (): void => {
  core.debug(`Validating inputs…`);

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
};

export { validate };
