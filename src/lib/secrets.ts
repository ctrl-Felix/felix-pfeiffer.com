import { readFileSync } from "node:fs";

export function readSecret(name: string) {
  const file = process.env[`${name}_FILE`];
  const value = file ? readFileSync(file, "utf8") : process.env[name];
  return value?.trim() || undefined;
}
