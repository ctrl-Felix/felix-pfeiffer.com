const algorithms: Record<number, string> = {
  1: "RSA/MD5",
  3: "DSA/SHA-1",
  5: "RSA/SHA-1",
  6: "DSA-NSEC3-SHA-1",
  7: "RSASHA1-NSEC3-SHA-1",
  8: "RSA/SHA-256",
  10: "RSA/SHA-512",
  12: "ECC-GOST",
  13: "ECDSA P-256/SHA-256",
  14: "ECDSA P-384/SHA-384",
  15: "Ed25519",
  16: "Ed448",
};

const digestTypes: Record<number, string> = { 1: "SHA-1", 2: "SHA-256", 3: "GOST R 34.11-94", 4: "SHA-384" };

export const algorithmName = (value: number | null) => (value === null ? null : (algorithms[value] ?? `Algorithm ${value}`));
export const digestTypeName = (value: number | null) => (value === null ? null : (digestTypes[value] ?? `Type ${value}`));
