import core from '@actions/core';
import fetch from 'node-fetch';

const slack = async (payload, webhook) => {
  const res = await fetch(webhook, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json'
    }
  });
  core.debug(`Slack response: ${await res.text()}`);
};

export { slack };
