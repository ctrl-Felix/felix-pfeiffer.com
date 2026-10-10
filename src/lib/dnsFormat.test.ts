import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyTxt, formatDuration, hostmasterToEmail } from "./dnsFormat";

test("SOA hostmaster names become email addresses", () => {
  assert.equal(hostmasterToEmail("noc.dns.icann.org."), "noc@dns.icann.org");
  assert.equal(hostmasterToEmail("hostmaster"), "hostmaster");
});

test("TXT records are classified by their well known prefixes", () => {
  assert.equal(classifyTxt("v=spf1 include:_spf.example.com -all"), "SPF");
  assert.equal(classifyTxt("v=DMARC1; p=reject"), "DMARC");
  assert.equal(classifyTxt("v=DKIM1; k=rsa; p=abc"), "DKIM");
  assert.equal(classifyTxt("google-site-verification=abc"), "Verification");
  assert.equal(classifyTxt("hello world"), null);
});

test("durations are shown in the largest sensible unit", () => {
  assert.equal(formatDuration(45), "45 s");
  assert.equal(formatDuration(300), "5 min");
  assert.equal(formatDuration(7200), "2 h");
  assert.equal(formatDuration(1_209_600), "14 d");
  assert.equal(formatDuration(-1), "—");
});
