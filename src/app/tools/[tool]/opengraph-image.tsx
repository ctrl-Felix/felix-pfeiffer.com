import { ImageResponse } from "next/og";
import { site } from "@/config";
import { findToolInfo, toolInfos } from "@/data/tools";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Free online tool by Felix Pfeiffer";

export function generateStaticParams() {
  return toolInfos.map((tool) => ({ tool: tool.id }));
}

export default async function Image(props: { params: Promise<{ tool: string }> }) {
  const tool = findToolInfo((await props.params).tool);
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
          background: "linear-gradient(135deg, #5ac8fa 0%, #0a64e6 55%, #7a3cff 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36, fontWeight: 700 }}>
          <div style={{ display: "flex", width: 84, height: 84, borderRadius: 22, background: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center", fontSize: 44 }}>
            FP
          </div>
          {site.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 88, fontWeight: 800, lineHeight: 1.05 }}>{tool?.seo.heading ?? "Tools"}</div>
          <div style={{ display: "flex", fontSize: 34, opacity: 0.9 }}>{tool?.description ?? ""}</div>
        </div>
        <div style={{ display: "flex", fontSize: 30, opacity: 0.85 }}>felix-pfeiffer.com/tools/{tool?.id}</div>
      </div>
    ),
    size,
  );
}
