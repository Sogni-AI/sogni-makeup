import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import pluginTs from "@typescript-eslint/eslint-plugin";
import parserTs from "@typescript-eslint/parser";

// Helper to trim whitespace from global names
const cleanGlobals = (g) =>
  Object.fromEntries(Object.entries(g).map(([k, v]) => [k.trim(), v]));

/**
 * ESLint Flat Config for Sogni Makeover
 * - Supports JS, TS, React
 * - Uses recommended rules for all
 */

export default [
  // JavaScript & JSX (js.configs.recommended)
  {
    ...js.configs.recommended,
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      globals: cleanGlobals(globals.browser),
    },
  },
  // TypeScript & TSX
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: parserTs,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.json",
      },
      globals: cleanGlobals(globals.browser),
    },
    plugins: { "@typescript-eslint": pluginTs },
    rules: {
      ...pluginTs.configs.recommended.rules,
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/unbound-method": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // React (JSX/TSX)
  {
    files: ["**/*.{jsx,tsx}"],
    ...pluginReact.configs.flat.recommended,
    plugins: {
      ...pluginReact.configs.flat.recommended.plugins,
      "@typescript-eslint": pluginTs,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      // Not needed with React 18 JSX transform (react-jsx)
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      // Enforce strict useEffect dependency rules
      "react-hooks/exhaustive-deps": [
        "error",
        {
          additionalHooks: "",
          enableDangerousAutofixThisMayCauseInfiniteLoops: false,
        },
      ],
    },
  },
  // Custom rule: Catch common useEffect violations
  {
    files: ["**/*.{jsx,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name='useEffect'] > ArrayExpression[elements.length>3]",
          message:
            "useEffect has too many dependencies (>3). Split into multiple effects with single responsibilities.",
        },
      ],
    },
  },
];
