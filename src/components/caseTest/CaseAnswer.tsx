import type { CaseItem } from "@/data/caseTest/types";
import { isCorrect, type CaseAnswer as Answer } from "@/lib/caseTest";

type Props = {
  item: CaseItem;
  value: Answer | undefined;
  onChange?: (value: Answer) => void;
  review?: boolean;
};

const neutral = "bg-white/80 shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)]";
const chosen = "bg-[#0a84ff]/10 shadow-[0_0_0_2px_#0a84ff]";
const right = "bg-[#34c759]/15 shadow-[0_0_0_2px_#34c759]";
const wrong = "bg-[#ff3b30]/10 shadow-[0_0_0_2px_#ff3b30]";

function Pick({ item, value, onChange, review }: Props & { item: Extract<CaseItem, { format: "pick" }> }) {
  const tone = (index: number) => {
    if (review && index === item.answer) return right;
    if (review && index === value) return wrong;
    return !review && index === value ? chosen : neutral;
  };
  return (
    <div className="space-y-1.5">
      {item.options.map((option, index) => (
        <button
          key={option}
          type="button"
          disabled={review}
          onClick={() => onChange?.(index)}
          className={`flex w-full gap-2 rounded-xl px-3 py-2 text-left text-[14px] ${tone(index)} ${review ? "cursor-default" : "hover:bg-white"}`}
        >
          <span className="w-4 shrink-0 text-[12px] font-semibold leading-5 text-black/45">{"ABCDE"[index]}</span>
          <span>{option}</span>
        </button>
      ))}
    </div>
  );
}

function Type({ item, value, onChange, review }: Props & { item: Extract<CaseItem, { format: "type" }> }) {
  const text = typeof value === "string" ? value : "";
  return (
    <div className="space-y-2">
      <label className="flex max-w-xs items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          readOnly={review}
          onChange={(event) => onChange?.(event.target.value)}
          aria-label="Your answer"
          className={`w-full rounded-lg px-3 py-2 text-[15px] tabular-nums outline-none ${review ? (isCorrect(item, value) ? right : wrong) : "bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)] focus:shadow-[0_0_0_2px_#0a84ff]"}`}
        />
        {item.unit && <span className="text-[13px] text-black/55">{item.unit}</span>}
      </label>
      {review && <p className="text-[13px] text-black/70">Correct: {item.answer.toLocaleString("en-GB", { minimumFractionDigits: item.decimals, maximumFractionDigits: item.decimals })}{item.unit ? ` ${item.unit}` : ""}</p>}
    </div>
  );
}

function Rank({ item, value, onChange, review }: Props & { item: Extract<CaseItem, { format: "rank" }> }) {
  const order = Array.isArray(value) ? value : [];
  const toggle = (index: number) => onChange?.(order.includes(index) ? order.filter((entry) => entry !== index) : [...order, index]);
  if (review) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { title: "Your order", list: order },
          { title: "Correct order", list: item.order },
        ].map(({ title, list }) => (
          <ol key={title} className="space-y-1 text-[14px]">
            <li className="text-[12px] font-semibold text-black/50">{title}</li>
            {list.map((index, position) => (
              <li key={index} className={`rounded-lg px-3 py-1.5 ${title === "Correct order" ? neutral : index === item.order[position] ? right : wrong}`}>
                {position + 1}. {item.items[index]}
              </li>
            ))}
            {!list.length && <li className="text-black/45">No answer</li>}
          </ol>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-[12px] text-black/50">Tap the items in order. Tap again to remove one.</p>
      <div className="space-y-1.5">
        {item.items.map((label, index) => {
          const position = order.indexOf(index);
          return (
            <button key={label} type="button" onClick={() => toggle(index)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[14px] ${position >= 0 ? chosen : neutral} hover:bg-white`}>
              <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${position >= 0 ? "bg-[#0a84ff] text-white" : "bg-black/10 text-transparent"}`}>{position + 1}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CaseAnswer(props: Props) {
  const { item } = props;
  if (item.format === "pick") return <Pick {...props} item={item} />;
  if (item.format === "type") return <Type {...props} item={item} />;
  return <Rank {...props} item={item} />;
}
