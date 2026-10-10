"use client";

import { parseMarkdown, type Inline } from "@/lib/markdown";
import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";

function Inlines({ content }: { content: Inline[] }) {
  return (
    <>
      {content.map((part, index) => {
        if (part.type === "bold") return <strong key={index}>{part.value}</strong>;
        if (part.type === "code") return <code key={index} className="rounded bg-black/7 px-1 py-0.5 text-[0.9em]">{part.value}</code>;
        if (part.type === "link") return <a key={index} href={part.href} className="text-[#0a6cf0] underline" target="_blank" rel="noopener noreferrer">{part.value}</a>;
        return <span key={index}>{part.value}</span>;
      })}
    </>
  );
}

type Props = { title: string; source: string };

export default function DocumentReader({ title, source }: Props) {
  const { dragProps } = useWindow();
  const blocks = parseMarkdown(source);

  return (
    <div className="flex h-full flex-col bg-[#fbfbfd]/95 text-[#1d1d1f]">
      <div className="flex h-12 shrink-0 items-center border-b border-black/10 px-4" {...dragProps}>
        <TrafficLights />
        <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">{title}</h1>
      </div>
      <article className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-xl space-y-4 text-[15px] leading-relaxed">
          {blocks.map((block, index) => {
            if (block.type === "heading") {
              const size = block.level === 1 ? "text-3xl font-bold" : block.level === 2 ? "text-xl font-semibold" : "text-lg font-semibold";
              return <p key={index} role="heading" aria-level={block.level} className={size}><Inlines content={block.content} /></p>;
            }
            if (block.type === "list") {
              return (
                <ul key={index} className="list-disc space-y-1 pl-5">
                  {block.items.map((item, itemIndex) => <li key={itemIndex}><Inlines content={item} /></li>)}
                </ul>
              );
            }
            return <p key={index}><Inlines content={block.content} /></p>;
          })}
        </div>
      </article>
    </div>
  );
}
