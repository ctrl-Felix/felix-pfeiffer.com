import { findToolInfo } from "@/data/tools";

export const card = "overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]";

export function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section>
      {title && <h3 className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-black/45">{title}</h3>}
      <div className={`${card} divide-y divide-black/10`}>{children}</div>
    </section>
  );
}

export function ResultHeader({ title, badge, badgeClass, mono }: { title: string; badge: string; badgeClass: string; mono?: boolean }) {
  return (
    <div className={`${card} flex items-center justify-between gap-3 px-4 py-3`}>
      <h2 className={`min-w-0 font-semibold ${mono ? "break-all font-mono text-base" : "truncate text-lg"}`}>{title}</h2>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>{badge}</span>
    </div>
  );
}

export function ToolAbout({ toolId, intro, children }: { toolId: string; intro?: string; children?: React.ReactNode }) {
  const tool = findToolInfo(toolId);
  if (!tool) return null;
  return (
    <div className="space-y-4 pt-2">
      <p className="text-[13px] text-black/60">{intro ?? tool.description}</p>
      {children}
      <section>
        <h2 className="mb-2 text-sm font-semibold">Frequently asked questions</h2>
        <div className={`${card} divide-y divide-black/10`}>
          {tool.seo.faq.map((item) => (
            <details key={item.question} className="px-4 py-2.5 text-[13px]">
              <summary className="cursor-default font-medium">{item.question}</summary>
              <p className="mt-1.5 text-black/60">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
