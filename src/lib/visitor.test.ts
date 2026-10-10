import assert from "node:assert/strict";
import { test } from "node:test";
import { isBot, networkOf } from "./visitor";

test("networkOf keeps IPv4 and reduces IPv6 to its /64 network", () => {
  assert.equal(networkOf("203.0.113.7"), "203.0.113.7");
  assert.equal(networkOf("::ffff:203.0.113.7"), "203.0.113.7");
  assert.equal(networkOf("2001:db8:abcd:12::1"), networkOf("2001:db8:abcd:12:aaaa:bbbb:cccc:dddd"));
  assert.notEqual(networkOf("2001:db8:abcd:12::1"), networkOf("2001:db8:abcd:13::1"));
  assert.equal(networkOf("fe80::1%eth0"), networkOf("fe80::2"));
});

test("isBot flags crawlers and tools but not browsers", () => {
  const browser = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
  assert.equal(isBot(browser), false);
  for (const agent of ["", "Googlebot/2.1", "curl/8.0", "Go-http-client/2.0", "Lighthouse", "UptimeRobot/2.0", "python-requests/2.31"]) {
    assert.equal(isBot(agent), true, agent);
  }
});
