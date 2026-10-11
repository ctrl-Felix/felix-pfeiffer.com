const markerPattern = /^Routine:\s*(.+)$/i;
const firedPattern = /Fired by routine "([^"\n]{1,200})"/;

export function cleanName(raw: string) {
  const name = raw
    .replace(/[^\p{L}\p{N} _.,()&/-]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return name || null;
}

export function routineName(text: string) {
  const fired = text.match(firedPattern);
  if (fired) return cleanName(fired[1]);
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
  for (const line of lines) {
    const match = line.match(markerPattern);
    if (!match) continue;
    return cleanName(match[1]);
  }
  return null;
}
