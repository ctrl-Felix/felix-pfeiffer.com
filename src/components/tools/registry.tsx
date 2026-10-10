import { WhoisIcon } from "@/components/Icons";
import { toolInfos, type ToolInfo } from "@/data/tools";
import WhoisTool from "./WhoisTool";

export type Tool = ToolInfo & {
  Icon: () => React.JSX.Element;
  Component: React.ComponentType;
};

const parts: Record<string, Pick<Tool, "Icon" | "Component">> = {
  whois: { Icon: WhoisIcon, Component: WhoisTool },
};

export const tools: Tool[] = toolInfos.map((info) => ({ ...info, ...parts[info.id] }));

export function matchTools(query: string) {
  const needle = query.trim().toLowerCase();
  return tools.filter((tool) => [tool.name, tool.description, ...tool.keywords].join(" ").toLowerCase().includes(needle));
}
