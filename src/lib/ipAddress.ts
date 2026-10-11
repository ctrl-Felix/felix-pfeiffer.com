import { BlockList, isIP } from "node:net";

const reserved = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.31.196.0", 24], ["192.52.193.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["192.175.48.0", 24], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
] as const) reserved.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
  ["64:ff9b::", 96], ["64:ff9b:1::", 48], ["100::", 64], ["2001::", 23], ["2001:db8::", 32], ["2002::", 16], ["3fff::", 20], ["5f00::", 16],
] as const) reserved.addSubnet(network, prefix, "ipv6");

const globalUnicast = new BlockList();
globalUnicast.addSubnet("2000::", 3, "ipv6");

export type IpVersion = 4 | 6;

function expandIpv6(address: string) {
  const [head, tail = ""] = address.split("::");
  const left = head ? head.split(":") : [];
  const right = address.includes("::") ? (tail ? tail.split(":") : []) : [];
  const missing = 8 - left.length - right.length;
  return [...left, ...Array(address.includes("::") ? missing : 0).fill("0"), ...right].map((group) => group.padStart(4, "0"));
}

export function canonicalIp(address: string) {
  const version = isIP(address);
  if (version === 4) return address.split(".").map((part) => String(Number(part))).join(".");
  if (version !== 6) return null;
  const groups = expandIpv6(address.toLowerCase()).map((group) => group.replace(/^0+(?=.)/, ""));
  const text = groups.join(":");
  const runs = [...text.matchAll(/(?:^|:)0(?::0)+(?=:|$)/g)].sort((a, b) => b[0].length - a[0].length);
  if (!runs.length) return text;
  const run = runs[0];
  const start = run.index ?? 0;
  const before = text.slice(0, start);
  const after = text.slice(start + run[0].length).replace(/^:/, "");
  return `${before}::${after}`;
}

export function normalizeIp(input: string): { ip: string; version: IpVersion } | null {
  const value = input.trim().replace(/^\[(.*)\]$/, "$1");
  if (!value || value.length > 45 || value.includes("%")) return null;
  const version = isIP(value);
  if (version === 4) {
    if (!/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(value) || reserved.check(value, "ipv4")) return null;
    return { ip: canonicalIp(value)!, version: 4 };
  }
  if (version === 6) {
    if (value.includes(".") || !globalUnicast.check(value, "ipv6") || reserved.check(value, "ipv6")) return null;
    return { ip: canonicalIp(value)!, version: 6 };
  }
  return null;
}

export function reverseLabels(ip: string, version: IpVersion) {
  if (version === 4) return ip.split(".").reverse().join(".");
  return expandIpv6(ip).join("").split("").reverse().join(".");
}

export function containsIp(cidr: string, ip: string, version: IpVersion) {
  const [network, length] = cidr.split("/");
  const prefix = Number(length);
  const family = version === 4 ? "ipv4" : "ipv6";
  if (isIP(network) !== version || !Number.isInteger(prefix) || prefix < 0 || prefix > (version === 4 ? 32 : 128)) return false;
  const list = new BlockList();
  list.addSubnet(network, prefix, family);
  return list.check(ip, family);
}
