"use client";

import { useWindow } from "@/components/windows/context";
import TrafficLights from "@/components/windows/TrafficLights";
import { messageTotal } from "@/lib/messageCount";
import { routineTotals } from "@/lib/routineUsage";
import { formatMillions, modelName, tokenTotals } from "@/lib/tokenUsage";
import UsageCards from "./UsageCards";
import UsageList from "./UsageList";

const build = tokenTotals();
const routines = routineTotals();

const count = (value: number, singular: string, plural: string) => `${value.toLocaleString("en-US")} ${value === 1 ? singular : plural}`;

export default function TokenUsageWindow() {
  const { dragProps } = useWindow();

  return (
    <div className="flex h-full flex-col bg-[#f5f5f7]/90 text-[#1d1d1f]">
      <div className="flex h-12 shrink-0 items-center border-b border-black/10 px-4" {...dragProps}>
        <TrafficLights />
        <h1 className="flex-1 pr-14 text-center text-[13px] font-semibold">Token Usage</h1>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Building</h2>
            <p className="text-[13px] text-black/60">What it took to build this page.</p>
          </div>
          <UsageCards
            cards={[
              { label: "Processed", hint: "tokens read", value: formatMillions(build.processed) },
              { label: "Written", hint: "tokens generated", value: formatMillions(build.written) },
              { label: "Messages", hint: "sent by Felix", value: messageTotal().toLocaleString("en-US") },
            ]}
          />
          <UsageList
            total={build.processed}
            empty="No usage recorded yet."
            rows={build.models.map((item) => ({
              id: item.model,
              name: modelName(item.model),
              processed: item.processed,
              detail: `${count(item.messages, "message", "messages")}, ${formatMillions(item.processed)} read, ${formatMillions(item.written)} generated`,
            }))}
          />
        </section>
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Routines</h2>
            <p className="text-[13px] text-black/60">Scheduled runs that maintain this page.</p>
          </div>
          <UsageCards
            cards={[
              { label: "Processed", hint: "tokens read", value: formatMillions(routines.processed) },
              { label: "Written", hint: "tokens generated", value: formatMillions(routines.written) },
              { label: "Executions", hint: "routine runs", value: routines.executions.toLocaleString("en-US") },
            ]}
          />
          <UsageList
            total={routines.processed}
            empty="No routine has run yet."
            rows={routines.routines.map((item) => ({
              id: item.name,
              name: item.name,
              processed: item.processed,
              detail: `${count(item.executions, "execution", "executions")}, ${formatMillions(item.processed)} read, ${formatMillions(item.written)} generated`,
            }))}
          />
        </section>
        <p className="text-center text-[11px] text-black/40">Read includes context re-read on every step. Each message and execution is counted once.</p>
      </div>
    </div>
  );
}
