type Row = { id: string; name: string; processed: number; detail: string };

export default function UsageList({ rows, total, empty }: { rows: Row[]; total: number; empty: string }) {
  if (!rows.length) return <p className="py-4 text-center text-[13px] text-black/45">{empty}</p>;
  return (
    <ul className="divide-y divide-black/10 overflow-hidden rounded-xl bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
      {rows.map((item) => {
        const share = total ? (item.processed / total) * 100 : 0;
        return (
          <li key={item.id} className="px-4 py-3 text-[13px]">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate font-medium">{item.name}</span>
              <span className="text-black/55">{share.toFixed(share < 10 && share > 0 ? 1 : 0)}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/8">
              <div className="h-full rounded-full bg-[#0a84ff]" style={{ width: `${Math.max(share, 1)}%` }} />
            </div>
            <div className="mt-1.5 text-xs text-black/55">{item.detail}</div>
          </li>
        );
      })}
    </ul>
  );
}
