const months: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

function build(year: number, month: number, day: number, hour = 0, minute = 0, second = 0) {
  if (year < 1985 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return date.getUTCMonth() === month - 1 ? date.toISOString() : null;
}

export function parseWhoisDate(input: string | null) {
  if (!input) return null;
  if (/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:?\d{2})$/i.test(input.trim())) {
    const exact = Date.parse(input.trim());
    if (!Number.isNaN(exact)) return new Date(exact).toISOString();
  }
  const text = input
    .replace(/#.*$/, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/\b(before|utc|gmt|jst|cest|cet|bst|est|edt|pst|pdt)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return null;

  const time = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  const [hour, minute, second] = time ? [Number(time[1]), Number(time[2]), Number(time[3] ?? 0)] : [0, 0, 0];
  const withoutTime = text.replace(/[T ]?\d{1,2}:\d{2}(:\d{2})?(\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?/i, " ").trim();

  let match = withoutTime.match(/^(\d{4})[-./ ]+(\d{1,2})[-./ ]+(\d{1,2})\.?$/);
  if (match) return build(Number(match[1]), Number(match[2]), Number(match[3]), hour, minute, second);

  match = withoutTime.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (match) return build(Number(match[1]), Number(match[2]), Number(match[3]), hour, minute, second);

  match = withoutTime.match(/^(\d{1,2})[-./ ]+([A-Za-z]{3})[a-z]*[-./ ,]+(\d{4})$/);
  if (match) return build(Number(match[3]), months[match[2].toLowerCase()] ?? 0, Number(match[1]), hour, minute, second);

  match = withoutTime.match(/^([A-Za-z]{3})[a-z]*[-./ ]+(\d{1,2})(?:st|nd|rd|th)?,?[-./ ]+(\d{4})$/);
  if (match) return build(Number(match[3]), months[match[1].toLowerCase()] ?? 0, Number(match[2]), hour, minute, second);

  match = withoutTime.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
  if (match) return build(Number(match[3]), Number(match[2]), Number(match[1]), hour, minute, second);

  const parsed = Date.parse(input.replace(/#.*$/, "").trim());
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}
