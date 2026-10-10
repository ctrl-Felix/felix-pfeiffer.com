import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeDomain } from "./whois";

test("normalizeDomain accepts plain domains, URLs and international names", () => {
  assert.equal(normalizeDomain("Example.COM"), "example.com");
  assert.equal(normalizeDomain("https://www.example.com/path?x=1"), "www.example.com");
  assert.equal(normalizeDomain("example.com."), "example.com");
  assert.equal(normalizeDomain("münchen.de"), "xn--mnchen-3ya.de");
});

test("normalizeDomain rejects anything that is not a public domain name", () => {
  const invalid = ["", "localhost", "127.0.0.1", "a b.com", "-bad.com", "bad_.com", "x.123", `${"a".repeat(64)}.com`, "http://", "example.com:80"];
  for (const value of invalid) assert.equal(normalizeDomain(value), null, value);
});
