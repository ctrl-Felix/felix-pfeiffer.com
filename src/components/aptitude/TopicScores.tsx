type Score = { id: string; label: string; correct: number; total: number };

export default function TopicScores({ scores, onPractice }: { scores: Score[]; onPractice?: (id: string) => void }) {
  const sorted = [...scores].sort((a, b) => a.correct / a.total - b.correct / b.total);
  return (
    <section className="space-y-1.5">
      <h3 className="text-[13px] font-semibold">By topic, weakest first</h3>
      {sorted.map((score) => {
        const share = score.correct / score.total;
        return (
          <div key={score.id} className="flex items-center gap-3 rounded-xl bg-white/80 px-3 py-2 shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)]">
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2 text-[13px]">
                <span className="truncate">{score.label}</span>
                <span className="shrink-0 tabular-nums text-black/60">
                  {score.correct}/{score.total}
                </span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/10">
                <div className={`h-full rounded-full ${share < 0.5 ? "bg-[#ff3b30]" : share < 0.8 ? "bg-[#ff9500]" : "bg-[#34c759]"}`} style={{ width: `${share * 100}%` }} />
              </div>
            </div>
            {onPractice && (
              <button type="button" onClick={() => onPractice(score.id)} className="shrink-0 text-[12px] font-medium text-[#0a84ff] hover:underline">
                Practice
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}
