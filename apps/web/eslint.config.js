import { nextJsConfig } from "@repo/eslint-config/next-js";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    files: ["*.config.js", "*.config.mjs", "next.config.js"],
    languageOptions: { globals: globals.node },
  },
];
