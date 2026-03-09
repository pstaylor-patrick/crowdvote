import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/",
      "**/.next/",
      "**/dist/",
      "**/.turbo/",
      "**/*.js",
      "**/*.mjs",
      "**/*.d.ts",
      "**/vitest.config.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // Fire-and-forget fetch in useEffect/handlers is idiomatic React
      "@typescript-eslint/no-floating-promises": "off",
      // req.json() and JSON.parse return any — pervasive in Next.js API routes
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      // onClick handlers returning promises is idiomatic in React
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "@next/next": nextPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // SSE pattern uses useCallback with setState in effects — expected pattern
      "react-hooks/set-state-in-effect": "off",
      // Button asChild with <a> is a valid Radix UI pattern
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    files: ["packages/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  eslintConfigPrettier
);
