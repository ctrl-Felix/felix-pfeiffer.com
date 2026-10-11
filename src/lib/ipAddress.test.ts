import assert from "node:assert/strict";
import { test } from "node:test";
import { canonicalIp, containsIp, normalizeIp, reverseLabels } from "./ipAddress";

test("public addresses pass and are written canonically", () => {
  assert.deepEqual(normalizeIp(" 1.1.1.1 "), { ip: "1.1.1.1", version: 4 });
  assert.deepEqual(normalizeIp("[2606:4700:4700:0:0:0:0:1111]"), { ip: "2606:4700:4700::1111", version: 6 });
  assert.deepEqual(normalizeIp("2A00:1450:4001:80B::200E"), { ip: "2a00:1450:4001:80b::200e", version: 6 });
  assert.equal(canonicalIp("2001:0db8:0000:0000:0001:0000:0000:0001"), "2001:db8::1:0:0:1");
});

test("private, reserved, documentation and malformed addresses are rejected", () => {
  for (const bad of [
    "", "example.com", "10.0.0.1", "172.16.5.4", "192.168.1.1", "127.0.0.1", "0.0.0.0", "169.254.169.254", "100.64.0.1", "192.0.2.1", "198.51.100.7",
    "203.0.113.9", "198.18.0.1", "224.0.0.1", "255.255.255.255", "01.1.1.1", "1.1.1", "::", "::1", "fe80::1", "fc00::1", "fd12::1", "ff02::1",
    "2001:db8::1", "2002::1", "64:ff9b::1.1.1.1", "::ffff:1.1.1.1", "fe80::1%eth0", "1.1.1.1/24",
  ]) {
    assert.equal(normalizeIp(bad), null, bad);
  }
});

test("reverse labels and prefix checks", () => {
  assert.equal(reverseLabels("1.2.3.4", 4), "4.3.2.1");
  assert.equal(reverseLabels("2001:4860::8888", 6), "8.8.8.8.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.6.8.4.1.0.0.2");
  assert.equal(containsIp("1.0.0.0/8", "1.1.1.1", 4), true);
  assert.equal(containsIp("2.0.0.0/8", "1.1.1.1", 4), false);
  assert.equal(containsIp("2600::/12", "2606:4700::1", 6), true);
  assert.equal(containsIp("nonsense", "1.1.1.1", 4), false);
});
