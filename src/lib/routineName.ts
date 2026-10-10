const markerPattern = /^Routine:\s*(.+)$/i;

export function routineName(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);
  for (const line of lines) {
    const match = line.match(markerPattern);
    if (!match) continue;
    const name = match[1]
      .replace(/[^\p{L}\p{N} _.,()&/-]/gu, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 60);
    return name || null;
  }
  return null;
}
