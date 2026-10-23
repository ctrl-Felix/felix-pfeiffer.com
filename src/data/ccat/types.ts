export type Shape =
  | "circle"
  | "square"
  | "triangle"
  | "diamond"
  | "pentagon"
  | "hexagon"
  | "star"
  | "cross"
  | "arrow"
  | "flag"
  | "hook"
  | "clock"
  | "half"
  | "dot";

export type Glyph = { shape: Shape; rotation?: number; mirror?: boolean; solid?: boolean; cell?: number };

export type Figure = Glyph[];

export type Category = "verbal" | "math" | "spatial";

export type Difficulty = 1 | 2 | 3;

export type Question = {
  category: Category;
  kind: string;
  difficulty: Difficulty;
  prompt: string;
  stem?: string;
  lines?: string[];
  pairs?: [string, string][];
  table?: string[][];
  sequence?: Figure[];
  matrix?: (Figure | null)[];
  options: (string | Figure)[];
  answer: number;
  keepOrder?: boolean;
  explanation: string;
};
