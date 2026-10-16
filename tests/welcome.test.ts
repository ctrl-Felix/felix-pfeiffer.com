import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { allApps } from "../src/components/apps";
import { hideSeenWelcomeScript } from "../src/components/welcome";
import { WindowProvider } from "../src/components/windows/WindowManager";
import { profile } from "../src/data/profile";

const render = (welcome?: string) => renderToString(createElement(WindowProvider, { apps: allApps, welcome }));
const escaped = (text: string) => text.replaceAll("&", "&amp;").replaceAll("'", "&#x27;").replaceAll('"', "&quot;");

function runScript(stored: string | null) {
  const appended: { textContent: string }[] = [];
  const style = { textContent: "" };
  const document = { createElement: () => style, head: { appendChild: (node: typeof style) => appended.push(node) } };
  const localStorage = { getItem: () => stored };
  new Function("document", "localStorage", hideSeenWelcomeScript)(document, localStorage);
  return appended.map((node) => node.textContent);
}

test("the welcome window is server rendered with the profile text", () => {
  const html = render("profile");
  assert.match(html, /role="dialog" aria-label="Profile"[^>]*class="[^"]*window-initial/);
  assert.ok(html.includes(escaped(profile.about)), "the about text is in the server HTML");
  assert.ok(html.includes(`>${profile.name}</h2>`), "the name is a visible heading");
});

test("without a welcome no window is server rendered", () => {
  assert.doesNotMatch(render(), /role="dialog"/);
});

test("the inline script hides the welcome window only for returning visitors", () => {
  assert.deepEqual(runScript(null), []);
  assert.deepEqual(runScript("1"), [".window-initial{display:none}"]);
});

test("the home page runs the script before it renders the welcome window", () => {
  const page = readFileSync(join(process.cwd(), "src/app/page.tsx"), "utf8");
  const script = page.indexOf("hideSeenWelcomeScript }}");
  const desktop = page.indexOf('<Desktop welcome="profile" />');
  assert.ok(script !== -1 && desktop !== -1 && script < desktop);
});
