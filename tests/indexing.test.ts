import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import nextConfig from "../next.config";
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";
import { site } from "../src/config";

type Request = { host: string; proto: string; path: string };

async function redirectFor({ host, proto, path }: Request) {
  const rules = await nextConfig.redirects!();
  const matches = (pattern: string, value: string) => new RegExp(`^${pattern}$`).test(value);
  const rule = rules.find((candidate) => {
    const sourceMatches = candidate.source === "/:path*" || candidate.source === path;
    const conditionsMatch = (candidate.has ?? []).every((condition) => {
      if (condition.type === "host") return matches(condition.value, host);
      if (condition.type === "header" && condition.key === "x-forwarded-proto") return matches(condition.value ?? "", proto);
      return false;
    });
    return sourceMatches && conditionsMatch;
  });
  if (!rule) return null;
  return { location: rule.destination.replace("/:path*", path), permanent: "permanent" in rule && rule.permanent };
}

test("the canonical https address is served without a redirect", async () => {
  assert.equal(site.url, "https://felix-pfeiffer.com");
  assert.equal(await redirectFor({ host: "felix-pfeiffer.com", proto: "https", path: "/" }), null);
  assert.equal(await redirectFor({ host: "felix-pfeiffer.com", proto: "https", path: "/about" }), null);
});

test("http and www addresses redirect permanently to the canonical https address", async () => {
  for (const request of [
    { host: "felix-pfeiffer.com", proto: "http", path: "/" },
    { host: "www.felix-pfeiffer.com", proto: "https", path: "/" },
    { host: "www.felix-pfeiffer.com", proto: "http", path: "/" },
  ]) {
    assert.deepEqual(await redirectFor(request), { location: `${site.url}/`, permanent: true }, `${request.proto}://${request.host}/`);
  }
  assert.deepEqual(await redirectFor({ host: "felix-pfeiffer.com", proto: "http", path: "/about" }), { location: `${site.url}/about`, permanent: true });
});

test("local and container requests are not redirected", async () => {
  for (const host of ["localhost", "127.0.0.1", "web"]) {
    assert.equal(await redirectFor({ host, proto: "http", path: "/" }), null, host);
  }
});

test("pages allow indexing and declare the https canonical", () => {
  const layout = readFileSync(join(process.cwd(), "src/app/layout.tsx"), "utf8");
  assert.match(layout, /robots: \{ index: true, follow: true \}/);
  assert.match(layout, /metadataBase: new URL\(site\.url\)/);
  assert.match(layout, /alternates: \{ canonical: "\/" \}/);
  assert.doesNotMatch(layout, /noindex|index: false/);
});

test("robots.txt lets Google and every other crawler reach the pages", () => {
  const rules = robots().rules;
  const list = Array.isArray(rules) ? rules : [rules];
  for (const rule of list) {
    assert.deepEqual(rule.allow, ["/"]);
    assert.deepEqual(rule.disallow, ["/api/"]);
  }
  assert.ok(list.some((rule) => rule.userAgent === "*"));
  assert.equal(robots().sitemap, `${site.url}/sitemap.xml`);
});

test("the sitemap lists the home page and only canonical https addresses", () => {
  const urls = sitemap().map((entry) => entry.url);
  assert.ok(urls.includes(`${site.url}/`) || urls.includes(site.url));
  for (const url of urls) assert.ok(url.startsWith(`${site.url}/`) || url === site.url, url);
});
