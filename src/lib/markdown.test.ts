import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInline, parseMarkdown } from "./markdown";

test("parseMarkdown reads headings, paragraphs and lists", () => {
  const blocks = parseMarkdown("# Title\n\nFirst line\nsecond line\n\n- one\n- two");
  assert.deepEqual(blocks.map((block) => block.type), ["heading", "paragraph", "list"]);
  assert.equal(blocks[0].type === "heading" && blocks[0].level, 1);
  assert.equal(blocks[2].type === "list" && blocks[2].items.length, 2);
});

test("parseInline handles bold, code and links", () => {
  const parts = parseInline("see **Profile** and `code` or [site](https://example.com)");
  assert.deepEqual(parts.map((part) => part.type), ["text", "bold", "text", "code", "text", "link"]);
});

test("parseInline refuses unsafe link targets", () => {
  const parts = parseInline("[bad](javascript:alert(1))");
  assert.equal(parts.some((part) => part.type === "link"), false);
});
