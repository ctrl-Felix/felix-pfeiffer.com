import { WhoisIcon } from "@/components/Icons";
import WhoisTool from "./WhoisTool";

export type Tool = {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  Icon: () => React.JSX.Element;
  Component: React.ComponentType;
};

export const tools: Tool[] = [
  {
    id: "whois",
    name: "Whois",
    description: "Look up who registered a domain, when it expires and which name servers it uses.",
    keywords: ["domain", "dns", "rdap", "registrar", "nameserver", "lookup"],
    Icon: WhoisIcon,
    Component: WhoisTool,
  },
];

export function matchTools(query: string) {
  const needle = query.trim().toLowerCase();
  return tools.filter((tool) => [tool.name, tool.description, ...tool.keywords].join(" ").toLowerCase().includes(needle));
}
