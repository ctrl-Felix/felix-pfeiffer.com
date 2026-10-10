import { formatMillions, tokenTotals } from "@/lib/tokenUsage";

const { processed, written } = tokenTotals();

const tokenLine =
  processed > 0
    ? `\nSo far, building this page has used about ${formatMillions(processed)} tokens, ${formatMillions(written)} of them written by Claude.\n`
    : "";

export const readme = `# README

I'm Felix Pfeiffer, and this is my personal portfolio.

My CV and the about me section are in **Profile**. This file explains what the page itself is about.

As much as I love coding, I was curious how far a 100% vibe coded project could go. That's what this page is.

Not a single line of code was written by me. Claude wrote all of it. This text is also written by AI, following my instructions.
${tokenLine}`;
