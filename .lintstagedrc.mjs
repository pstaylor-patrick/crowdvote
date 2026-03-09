export default {
  "*.{ts,tsx}": ["eslint --max-warnings 0 --no-warn-ignored", "prettier --check"],
  "*.{json,md,yml,yaml,css,mjs}": ["prettier --check"],
};
