import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer as createHttpServer, type Server } from "node:http";
import { createServer as createTcpServer, type Server as TcpServer } from "node:net";
import { after, before, test } from "node:test";

type Library = typeof import("./tldCoverage");
let library: Library;
let http: Server;
let whois: TcpServer;

const listen = (server: Server | TcpServer) =>
  new Promise<number>((resolve) => server.listen(0, "127.0.0.1", () => resolve((server.address() as { port: number }).port)));

before(async () => {
  http = createHttpServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    const { port } = http.address() as { port: number };
    response.end(JSON.stringify({ services: [[["com", "net"], [`http://127.0.0.1:${port}/rdap/`]]] }));
    void request;
  });
  whois = createTcpServer((socket) => {
    socket.once("data", (chunk) => {
      const query = chunk.toString().trim();
      if (query === "boom") return socket.destroy();
      const answers: Record<string, string> = {
        org: "domain: ORG\r\nwhois: whois.pir.org\r\n",
        "xn--p1ai": "domain: XN--P1AI\r\nwhois: whois.tcinet.ru\r\n",
        local: "domain: LOCAL\r\nwhois: localhost\r\n",
      };
      socket.end(answers[query] ?? `domain: ${query.toUpperCase()}\r\n`);
    });
  });
  const httpPort = await listen(http);
  const whoisPort = await listen(whois);
  process.env.RDAP_BOOTSTRAP_URL = `http://127.0.0.1:${httpPort}/dns.json`;
  process.env.WHOIS_ROOT_SERVER = `127.0.0.1:${whoisPort}`;
  library = await import("./tldCoverage");
});

after(() => {
  http.close();
  whois.close();
});

test("parseTldList reads the IANA format and drops comments and junk", () => {
  const text = "# Version 2026101000, Last Updated Sat Oct 10 07:07:01 2026 UTC\nCOM\r\nORG\nXN--P1AI\ncom\nnot a tld\n\n";
  assert.deepEqual(library.parseTldList(text), ["com", "org", "xn--p1ai"]);
});

test("a TLD is supported when RDAP or a public WHOIS server is found for it", async () => {
  assert.equal(await library.tldRoute("com"), "rdap");
  assert.equal(await library.tldRoute("org"), "whois");
  assert.equal(await library.tldRoute("xn--p1ai"), "whois");
  assert.equal(await library.tldRoute("nope"), "none");
  assert.equal(await library.tldRoute("local"), "none");
  assert.equal(await library.tldRoute("boom"), "error");
});

test("coverage marks supported and unsupported TLDs and keeps old values when a check fails", async () => {
  const { coverage, unknown } = await library.buildCoverage(["boom", "com", "nope", "org", "xn--p1ai", "net"], { boom: true });
  assert.deepEqual(coverage, { boom: true, com: true, net: true, nope: false, org: true, "xn--p1ai": true });
  assert.deepEqual(unknown, ["boom"]);
  assert.deepEqual(Object.keys(coverage), [...Object.keys(coverage)].sort());
});

test("the committed coverage file maps lowercase TLDs to true or false", () => {
  const data = JSON.parse(readFileSync(new URL("../data/tldCoverage.json", import.meta.url), "utf8"));
  const keys = Object.keys(data);
  assert.deepEqual(keys, [...keys].sort());
  for (const [tld, value] of Object.entries(data)) {
    assert.match(tld, /^[a-z0-9-]{2,63}$/);
    assert.equal(typeof value, "boolean", tld);
  }
});
