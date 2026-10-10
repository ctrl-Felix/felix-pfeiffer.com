import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='query'] > TemplateLiteral:first-child[expressions.length>0]",
          message: "Never interpolate values into SQL. Use $1 placeholders and pass values as the second argument.",
        },
        {
          selector: "CallExpression[callee.property.name='query'] > BinaryExpression:first-child",
          message: "Never concatenate SQL strings. Use $1 placeholders.",
        },
        {
          selector: "MemberExpression[object.object.name='process'][object.property.name='env'][property.name=/PASSWORD|SECRET|TOKEN|API_KEY/]",
          message: "Read credentials with readSecret() from src/lib/secrets.ts so they can come from files.",
        },
      ],
    },
  },
  {
    files: ["src/lib/db.ts", "src/lib/secrets.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/db.ts"],
    rules: {
      "no-restricted-imports": ["error", { paths: [{ name: "pg", message: "Use db() from src/lib/db.ts." }] }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
