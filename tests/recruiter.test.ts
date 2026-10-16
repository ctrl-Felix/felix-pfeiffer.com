import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { allApps, apps } from "../src/components/apps";
import { WindowProvider } from "../src/components/windows/WindowManager";
import { isTrackTarget } from "../src/lib/tracking";

test("the recruiter window sits on the desktop and its clicks are whitelisted", () => {
  const app = apps.find((candidate) => candidate.id === "recruiter");
  assert.equal(app?.desktopLabel, "Are you a recruiter?");
  assert.equal(isTrackTarget("recruiter"), true);
});

test("the recruiter window offers the three options", () => {
  const html = renderToString(createElement(WindowProvider, { apps: allApps, welcome: "recruiter" }));
  for (const title of ["Felix in 30 seconds", "Why hire me", "Beyond the CV"]) assert.ok(html.includes(title), title);
});
