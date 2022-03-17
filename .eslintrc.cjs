module.exports = {
  root: true,
  extends: [
    'standard',
    'prettier',
    'plugin:json/recommended',
    'plugin:markdown/recommended',
    'plugin:yml/recommended',
    'plugin:yml/prettier'
  ],
  parser: '@babel/eslint-parser',
  overrides: [
    {
      files: ['*.yml'],
      rules: {
        camelcase: 'off',
        'no-labels': 'off',
        'no-unused-expressions': 'off'
      }
    }
  ]
};
