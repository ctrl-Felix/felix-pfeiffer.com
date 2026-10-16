import { lookupFailed, lookupRoute } from "@/lib/lookupRoute";
import { findSubdomains, normalizeSubdomainQuery, TooManyCertificatesError } from "@/lib/subdomains";

export const GET = lookupRoute({
  bucket: "subdomains",
  perIp: 10,
  global: 30,
  param: "domain",
  normalize: normalizeSubdomainQuery,
  invalid: "Enter a valid public domain name, for example example.com.",
  lookup: findSubdomains,
  failure: (error) =>
    error instanceof TooManyCertificatesError
      ? lookupFailed("This domain has too many certificates to list. Try a more specific name, for example shop.example.com.", 422)
      : lookupFailed("The certificate logs and DNS resolvers did not answer. Please try again later.", 502),
});
