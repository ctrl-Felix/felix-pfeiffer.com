type Card = { label: string; hint: string; value: string };

export default function UsageCards({ cards }: { cards: Card[] }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-center">
      {cards.map((item) => (
        <div key={item.label} className="rounded-xl bg-white/80 px-2 py-3 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
          <div className="text-lg font-semibold">{item.value}</div>
          <div className="text-xs font-medium text-black/60">{item.label}</div>
          <div className="text-[11px] text-black/50">{item.hint}</div>
        </div>
      ))}
    </div>
  );
}
