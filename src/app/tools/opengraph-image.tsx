import { toolsHub } from "@/data/tools";
import { ogCard, ogSize } from "@/lib/ogCard";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Free online tools by Felix Pfeiffer";

export default function Image() {
  return ogCard(toolsHub.heading, "Whois, DNS, subdomain and IP tools, free and without sign up.", toolsHub.path);
}
