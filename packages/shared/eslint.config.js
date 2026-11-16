const base = require('@repo/eslint-config/base');

// @repo/eslint-config/base exports { config } (flat config array).
// The CommonJS config files themselves are not linted.
module.exports = [
  { ignores: ['dist/**', 'eslint.config.js', '.eslintrc.js'] },
  ...base.config,
];
