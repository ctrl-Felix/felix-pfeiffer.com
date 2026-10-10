import { ImageResponse } from "next/og";
import { site } from "@/config";
import { mcpPage } from "@/data/mcp";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "MCP servers for AI assistants";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          color: "white",
          background: "linear-gradient(135deg, #7fd6c2 0%, #0a64e6 55%, #7a3cff 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>{site.name}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 84, fontWeight: 800, lineHeight: 1.05 }}>{mcpPage.heading}</div>
          <div style={{ display: "flex", fontSize: 32, opacity: 0.9 }}>Free, open, no API key</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>felix-pfeiffer.com{mcpPage.path}</div>
      </div>
    ),
    size,
  );
}
