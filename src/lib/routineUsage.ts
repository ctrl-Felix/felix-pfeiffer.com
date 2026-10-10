import data from "@/data/routineUsage.json";

type Execution = [day: string, routine: string, model: string];
type RoutineEntry = [model: string, routine: string, input: number, output: number, cacheWrite: number, cacheRead: number];
type RoutineLedger = { executions: Record<string, Execution>; messages: Record<string, RoutineEntry> };
export type RoutineTotals = { name: string; executions: number; processed: number; written: number };

export function summarizeRoutines(ledger: RoutineLedger) {
  const perRoutine = new Map<string, RoutineTotals>();
  const totalsOf = (name: string) => {
    const totals = perRoutine.get(name) ?? { name, executions: 0, processed: 0, written: 0 };
    perRoutine.set(name, totals);
    return totals;
  };
  for (const [, routine] of Object.values(ledger.executions)) totalsOf(routine).executions += 1;
  for (const [, routine, input, output, cacheWrite, cacheRead] of Object.values(ledger.messages)) {
    const totals = totalsOf(routine);
    totals.processed += input + output + cacheWrite + cacheRead;
    totals.written += output;
  }
  const routines = [...perRoutine.values()].sort((a, b) => b.processed - a.processed);
  return {
    processed: routines.reduce((sum, item) => sum + item.processed, 0),
    written: routines.reduce((sum, item) => sum + item.written, 0),
    executions: routines.reduce((sum, item) => sum + item.executions, 0),
    routines,
  };
}

export const routineTotals = () => summarizeRoutines(data as unknown as RoutineLedger);
