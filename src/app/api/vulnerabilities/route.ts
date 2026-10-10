import { loadVulnerabilities } from "@/lib/vulnerabilities";

export function GET() {
  return Response.json({ items: loadVulnerabilities() });
}
