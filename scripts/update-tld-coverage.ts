import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildCoverage, parseTldList, type Coverage } from "../src/lib/tldCoverage";
import { loadBootstrap } from "../src/lib/whois";

const listUrl = process.env.TLD_LIST_URL ?? "https://data.iana.org/TLD/tlds-alpha-by-domain.txt";
const file = join(__dirname, "..", "src", "data", "tldCoverage.json");

async function readPrevious(): Promise<Coverage> {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  const response = await fetch(listUrl, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`TLD list unavailable (${response.status})`);
  const tlds = parseTldList(await response.text());
  if (tlds.length < 100) throw new Error(`TLD list looks wrong (${tlds.length} entries)`);
  await loadBootstrap();

  const previous = await readPrevious();
  const { coverage, unknown } = await buildCoverage(tlds, previous);
  await writeFile(file, `${JSON.stringify(coverage, null, 2)}\n`);

  const supported = Object.values(coverage).filter(Boolean).length;
  console.log(`${supported} of ${tlds.length} TLDs supported, ${tlds.length - supported} not.`);
  if (unknown.length) console.log(`Kept the previous value for ${unknown.length} TLDs that could not be checked: ${unknown.join(", ")}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
