const base = require('@repo/eslint-config/base');

// Same flat config as @repo/shared. Generated and build output is ignored.
module.exports = [
  {
    ignores: [
      'dist/**',
      'prisma/migrations/**',
      'eslint.config.js',
      '.eslintrc.js',
    ],
  },
  ...base.config,
];
