type Topic = { id: string; label: string; detail: string };

type Group = { title: string; topics: Topic[] };

export default function TopicPicker({ groups, onPick }: { groups: Group[]; onPick: (id: string) => void }) {
  return (
    <section className="mx-auto mt-6 max-w-md space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Practice one topic</h3>
        <p className="text-[12px] text-black/50">Train a single question type until it sticks.</p>
      </div>
      {groups.map((group) => (
        <div key={group.title} className="space-y-1.5">
          <p className="text-[12px] font-medium text-black/45">{group.title}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {group.topics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => onPick(topic.id)}
                className="rounded-xl bg-white/80 px-3 py-2 text-left shadow-[0_0_0_0.5px_rgba(0,0,0,0.06)] hover:bg-white"
              >
                <span className="block text-[13px] font-medium">{topic.label}</span>
                <span className="block text-[11px] text-black/50">{topic.detail}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
