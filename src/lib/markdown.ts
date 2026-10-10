export type Inline = { type: "text" | "bold" | "code"; value: string } | { type: "link"; value: string; href: string };
export type Block =
  | { type: "heading"; level: 1 | 2 | 3; content: Inline[] }
  | { type: "paragraph"; content: Inline[] }
  | { type: "list"; items: Inline[][] };

const inlinePattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
const safeHref = /^(https?:\/\/|\/|#|mailto:)/i;

export function parseInline(text: string): Inline[] {
  return text
    .split(inlinePattern)
    .filter(Boolean)
    .map((part): Inline => {
      if (part.startsWith("**") && part.endsWith("**")) return { type: "bold", value: part.slice(2, -2) };
      if (part.startsWith("`") && part.endsWith("`")) return { type: "code", value: part.slice(1, -1) };
      const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
      if (link && safeHref.test(link[2])) return { type: "link", value: link[1], href: link[2] };
      return { type: "text", value: part };
    });
}

export function parseMarkdown(source: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of source.trim().split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((line) => line.trimEnd());
    const heading = lines[0].match(/^(#{1,3})\s+(.*)$/);
    if (heading && lines.length === 1) {
      blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, content: parseInline(heading[2]) });
    } else if (lines.every((line) => /^[-*]\s+/.test(line))) {
      blocks.push({ type: "list", items: lines.map((line) => parseInline(line.replace(/^[-*]\s+/, ""))) });
    } else {
      blocks.push({ type: "paragraph", content: parseInline(lines.join(" ")) });
    }
  }
  return blocks;
}
