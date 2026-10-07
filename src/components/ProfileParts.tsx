import type { Entry } from "@/data/profile";

export function Group({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 divide-y divide-black/10 overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
      {children}
    </div>
  );
}

type RowProps = { label: string; value: string; href?: string; external?: boolean; stacked?: boolean };

export function Row({ label, value, href, external, stacked }: RowProps) {
  const valueClass = "text-[13px] text-black/55";
  return (
    <div className={`flex gap-4 px-4 py-2.5 text-[13px] ${stacked ? "flex-col gap-0.5" : "items-center justify-between"}`}>
      <span className="font-medium">{label}</span>
      {href ? (
        <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="text-[#0a6cf0] hover:underline">
          {value}
        </a>
      ) : (
        <span className={`${valueClass} ${stacked ? "" : "text-right"}`}>{value}</span>
      )}
    </div>
  );
}

export function EntryGroup({ entries }: { entries: Entry[] }) {
  return (
    <>
      {entries.map((entry) => (
        <Group key={entry.title + entry.org}>
          <div className="px-4 py-3">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">{entry.title}</p>
              <p className="shrink-0 text-xs text-black/45">{entry.period}</p>
            </div>
            <p className="text-[13px] text-[#0a6cf0]">{entry.org}</p>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-black/60">
              {entry.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </Group>
      ))}
    </>
  );
}
