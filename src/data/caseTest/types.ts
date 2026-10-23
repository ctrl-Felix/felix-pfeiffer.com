export type Section = "numerical" | "reasoning";

export type CaseItem =
  | { format: "pick"; prompt: string; options: string[]; answer: number; shuffle?: boolean; explanation: string }
  | { format: "type"; prompt: string; answer: number; decimals: number; unit?: string; explanation: string }
  | { format: "rank"; prompt: string; items: string[]; order: number[]; explanation: string };

export type Chart = { title: string; unit: string; bars: { label: string; value: number }[] };

export type CaseSet = {
  section: Section;
  title: string;
  context: string[];
  table?: string[][];
  chart?: Chart;
  items: CaseItem[];
};
