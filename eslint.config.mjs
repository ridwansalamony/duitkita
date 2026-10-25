import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next*/**",
      "public/ocr/**",
      "node_modules/**",
      "next-env.d.ts",
      "test-results/**",
      "test-results-*/**",
      "playwright-report/**",
    ],
  },
];
export default config;
