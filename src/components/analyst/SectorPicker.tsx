import { airlines, aviationSector } from "@/data/aviation";

function PlaneGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
    </svg>
  );
}

export default function SectorPicker({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="mx-auto max-w-xl">
      <h2 className="text-lg font-semibold">Choose a sector</h2>
      <p className="mt-0.5 text-[13px] text-black/55">Compare listed companies on their latest annual figures and live share prices.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onPick(aviationSector.id)}
          className="flex items-start gap-3 rounded-xl bg-white/85 p-4 text-left shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)] transition hover:bg-white hover:shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-[#3d8bff] to-[#0a4fc4] text-white">
            <PlaneGlyph />
          </span>
          <span>
            <span className="block text-[15px] font-semibold">{aviationSector.name}</span>
            <span className="block text-xs text-black/55">{airlines.length} European airline groups</span>
          </span>
        </button>
      </div>
      <p className="mt-4 text-xs text-black/40">More sectors will follow.</p>
    </div>
  );
}
