"use client";

import { useRouter } from "next/navigation";
import { mcpConnectors, mcpPage, mcpServerUrl } from "@/data/mcp";
import { trackClick } from "@/lib/track";

type Props = { open: boolean; onToggle: () => void; onClose: () => void };

export default function McpMenu({ open, onToggle, onClose }: Props) {
  const router = useRouter();

  const go = (hash = "") => {
    trackClick("mcp");
    onClose();
    router.push(`${mcpPage.path}${hash}`);
  };

  const copy = async (event: React.MouseEvent, value: string) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch {}
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={onToggle}
        className={`flex h-6 items-center rounded-md px-2.5 font-medium ${open ? "bg-white/25" : "hover:bg-white/15"}`}
      >
        MCP
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-7 w-72 rounded-xl bg-[#f5f5f7]/80 p-1.5 text-[13px] text-[#1d1d1f] shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(0,0,0,0.15)] backdrop-blur-2xl backdrop-saturate-200 [text-shadow:none]"
        >
          <p className="px-2.5 py-1 text-xs font-semibold text-black/50">MCP connectors</p>
          {mcpConnectors.map((connector) => (
            <div key={connector.id} role="menuitem" tabIndex={0} onClick={() => go(`#${connector.id}`)} onKeyDown={(event) => event.key === "Enter" && go(`#${connector.id}`)} className="flex cursor-default items-center gap-2 rounded-md px-2.5 py-1.5 hover:bg-[#0a84ff] hover:text-white">
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{connector.name}</span>
                <span className="block truncate text-xs opacity-70">{mcpServerUrl(connector)}</span>
              </span>
              <button type="button" onClick={(event) => copy(event, mcpServerUrl(connector))} className="shrink-0 rounded bg-black/10 px-1.5 py-0.5 text-xs hover:bg-black/20">
                Copy URL
              </button>
            </div>
          ))}
          <div role="separator" className="my-1 h-px bg-black/10" />
          <button
            type="button"
            role="menuitem"
            onClick={() => go()}
            className="flex w-full rounded-md px-2.5 py-1 text-left hover:bg-[#0a84ff] hover:text-white"
          >
            What is MCP? How to connect…
          </button>
          <span className="sr-only">{mcpPage.description}</span>
        </div>
      )}
    </div>
  );
}
