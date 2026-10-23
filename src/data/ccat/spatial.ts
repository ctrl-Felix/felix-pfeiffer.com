import { figureKey } from "@/lib/ccatFigure";
import type { Difficulty, Figure, Glyph, Question, Shape } from "./types";

const ring = [0, 1, 2, 5, 8, 7, 6, 3];

const at = (index: number) => ring[((index % 8) + 8) % 8];

const repeat = (glyph: Glyph, count: number): Figure => Array.from({ length: count }, () => ({ ...glyph }));

const distinct = (answer: Figure, candidates: Figure[], count = 4) => {
  const seen = new Set([figureKey(answer)]);
  const picked: Figure[] = [];
  for (const candidate of candidates) {
    const key = figureKey(candidate);
    if (!candidate.length || seen.has(key) || picked.length === count) continue;
    seen.add(key);
    picked.push(candidate);
  }
  return [answer, ...picked];
};

const series = (sequence: Figure[], answer: Figure, wrong: Figure[], difficulty: Difficulty, explanation: string): Question => ({
  category: "spatial",
  kind: "Next in series",
  difficulty,
  prompt: "Which figure comes next in the series?",
  sequence,
  options: distinct(answer, wrong),
  answer: 0,
  explanation,
});

const oddOneOut = (options: Figure[], odd: number, difficulty: Difficulty, explanation: string): Question => ({
  category: "spatial",
  kind: "Odd one out",
  difficulty,
  prompt: "Which figure does not belong?",
  options,
  answer: odd,
  explanation,
});

const matrix = (cells: Figure[], wrong: Figure[], difficulty: Difficulty, explanation: string): Question => ({
  category: "spatial",
  kind: "Matrix",
  difficulty,
  prompt: "Which figure completes the grid?",
  matrix: [...cells.slice(0, 8), null],
  options: distinct(cells[8], wrong),
  answer: 0,
  explanation,
});

const turn = (shape: Shape, start: number, step: number, difficulty: Difficulty, extra: Partial<Glyph> = {}) => {
  const figure = (index: number): Figure => [{ shape, rotation: start + index * step, ...extra }];
  const answer = figure(4);
  const direction = step > 0 ? "clockwise" : "counterclockwise";
  return series([0, 1, 2, 3].map(figure), answer, [
    figure(3),
    figure(5),
    [{ ...answer[0], mirror: true }],
    [{ ...answer[0], rotation: start + 4 * step + 180 }],
    [{ ...answer[0], rotation: start + 4 * step + 90 }],
    [{ ...answer[0], rotation: start + 4 * step - 45 }],
  ], difficulty, `The figure turns ${Math.abs(step)}° ${direction} each step.`);
};

const count = (shape: Shape, counts: number[], difficulty: Difficulty, rule: string, other: Shape) => {
  const last = counts[4];
  return series(
    counts.slice(0, 4).map((value) => repeat({ shape }, value)),
    repeat({ shape }, last),
    [repeat({ shape }, last + 1), repeat({ shape }, last - 1), repeat({ shape: other }, last), repeat({ shape }, counts[3]), repeat({ shape }, last + 2)],
    difficulty,
    rule,
  );
};

const orbit = (start: number, step: number, difficulty: Difficulty) => {
  const figure = (index: number): Figure => [{ shape: "dot", solid: true, cell: at(start + index * step) }];
  const direction = step > 0 ? "clockwise" : "counterclockwise";
  return series([0, 1, 2, 3].map(figure), figure(4), [figure(5), figure(3), figure(6), [{ shape: "dot", solid: true, cell: 4 }], figure(7)], difficulty, `The dot moves ${Math.abs(step)} ${Math.abs(step) === 1 ? "square" : "squares"} ${direction} around the edge each step.`);
};

const mirrorOdd = (shape: Shape, rotations: number[], odd: number, difficulty: Difficulty) =>
  oddOneOut(
    rotations.map((rotation, index) => [{ shape, rotation, mirror: index === odd }]),
    odd,
    difficulty,
    "The other figures are the same shape turned. This one is mirrored, and no turn can make it match.",
  );

const grid = (cell: (row: number, column: number) => Figure) => Array.from({ length: 9 }, (_, index) => cell(Math.floor(index / 3), index % 3));

const turnGrid = (shape: Shape, starts: number[], step: number, difficulty: Difficulty) => {
  const cells = grid((row, column) => [{ shape, rotation: starts[row] + column * step }]);
  const answer = cells[8][0];
  const rotation = answer.rotation ?? 0;
  return matrix(
    cells,
    [[{ shape, rotation: rotation + step }], [{ shape, rotation: rotation - step }], [{ shape, rotation: rotation + 180 }], [{ shape, rotation, mirror: true }], [{ shape, rotation: rotation + 90 }]],
    difficulty,
    `In every row the figure turns ${step}° clockwise from left to right.`,
  );
};

const unionGrid = (rows: [number[], number[]][], difficulty: Difficulty) => {
  const dots = (cells: number[]): Figure => cells.map((cell) => ({ shape: "dot", solid: true, cell }));
  const cells = rows.flatMap(([left, middle]) => [dots(left), dots(middle), dots([...left, ...middle])]);
  const [left, middle] = rows[2];
  const all = [...left, ...middle];
  const unused = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((cell) => !all.includes(cell));
  return matrix(
    cells,
    [dots(all.slice(1)), dots([...all, unused[0]]), dots(left), dots(middle), dots([...all.slice(1), unused[1]])],
    difficulty,
    "In each row the third figure combines the dots of the first two.",
  );
};

const orbitTurn = (dotStart: number, dotStep: number, arrowStep: number, difficulty: Difficulty) => {
  const figure = (index: number, arrowShift = 0, dotShift = 0): Figure => [
    { shape: "arrow", rotation: (index + arrowShift) * arrowStep, cell: 4 },
    { shape: "dot", solid: true, cell: at(dotStart + (index + dotShift) * dotStep) },
  ];
  return series([0, 1, 2, 3].map((index) => figure(index)), figure(4), [figure(4, 0, 1), figure(4, 1, 0), figure(4, -1, 0), figure(4, 0, -1), figure(4, 1, 1)], difficulty, `The arrow turns ${arrowStep}° clockwise and the dot moves ${Math.abs(dotStep)} ${Math.abs(dotStep) === 1 ? "square" : "squares"} ${dotStep > 0 ? "clockwise" : "counterclockwise"} each step.`);
};

const cycle = (shapes: Shape[], difficulty: Difficulty) => {
  const figure = (index: number, shape = shapes[index % 3], solid = index % 2 === 0, count = index + 1) => repeat({ shape, solid }, count);
  return series(
    [0, 1, 2, 3].map((index) => figure(index)),
    figure(4),
    [figure(4, shapes[1], false), figure(4, shapes[2]), figure(4, shapes[1], true, 4), figure(4, shapes[0]), figure(4, shapes[1], true, 6)],
    difficulty,
    `Each figure adds one shape, the shapes cycle ${shapes.join(", ")}, and the fill alternates.`,
  );
};

const latinGrid = (shapes: Shape[], countShift: number, withFill: boolean, difficulty: Difficulty) => {
  const glyphs = (row: number, column: number, shape = shapes[(row + column) % 3], count = 1 + ((row + 2 * column + countShift) % 3), solid = withFill && (2 * row + column) % 3 === 0) => repeat({ shape, solid }, count);
  const cells = grid((row, column) => glyphs(row, column));
  const answer = { shape: shapes[(2 + 2) % 3], count: 1 + ((2 + 4 + countShift) % 3), solid: withFill && 6 % 3 === 0 };
  const otherCount = (answer.count % 3) + 1;
  return matrix(
    cells,
    [glyphs(2, 2, shapes[0]), glyphs(2, 2, shapes[2]), glyphs(2, 2, answer.shape, otherCount), glyphs(2, 2, answer.shape, answer.count, !answer.solid), glyphs(2, 2, answer.shape, (otherCount % 3) + 1)],
    difficulty,
    `Every row and column holds each shape once and each count once${withFill ? ", and exactly one filled figure" : ""}.`,
  );
};

const xorGrid = (rows: [number[], number[]][], difficulty: Difficulty) => {
  const dots = (cells: number[]): Figure => cells.map((cell) => ({ shape: "dot", solid: true, cell }));
  const xor = (left: number[], middle: number[]) => [...left.filter((cell) => !middle.includes(cell)), ...middle.filter((cell) => !left.includes(cell))];
  const cells = rows.flatMap(([left, middle]) => [dots(left), dots(middle), dots(xor(left, middle))]);
  const [left, middle] = rows[2];
  const answer = xor(left, middle);
  const union = [...new Set([...left, ...middle])];
  const shared = left.filter((cell) => middle.includes(cell));
  return matrix(cells, [dots(union), dots(shared), dots(answer.slice(1)), dots(left), dots([...answer, ...shared.slice(0, 1), 4].filter((cell, index, all) => all.indexOf(cell) === index))], difficulty, "In each row the third figure keeps the dots that appear in only one of the first two. Dots in both disappear.");
};

const sides: Partial<Record<Shape, number>> = { triangle: 3, square: 4, pentagon: 5, hexagon: 6 };

const sidesOdd = (figures: Shape[][], odd: number, difficulty: Difficulty) => {
  const total = (shapes: Shape[]) => shapes.reduce((sum, shape) => sum + (sides[shape] ?? 0), 0);
  return oddOneOut(
    figures.map((shapes) => shapes.map((shape) => ({ shape }))),
    odd,
    difficulty,
    `The shapes in every other figure have ${total(figures[odd === 0 ? 1 : 0])} sides in total. This one has ${total(figures[odd])}.`,
  );
};

const flip = (difficulty: Difficulty) => {
  const figure = (index: number, mirror = index % 2 === 1, rotation = index * 90): Figure => [{ shape: "flag", rotation, mirror }];
  return series([0, 1, 2, 3].map((index) => figure(index)), figure(4), [figure(4, true), figure(4, false, 450), figure(4, true, 450), figure(4, false, 270), figure(4, false, 180)], difficulty, "The flag turns 90° clockwise each step and is mirrored on every second step.");
};

export const spatialQuestions: Question[] = [
  turn("flag", 0, 90, 2),
  turn("hook", 0, -90, 2),
  turn("flag", 45, 45, 2, { solid: true }),
  turn("arrow", 0, 135, 3),
  turn("clock", 0, 135, 3),
  turn("hook", 90, 135, 3),
  flip(3),

  count("triangle", [1, 1, 2, 3, 5], 2, "Each count is the sum of the two before it: 2 + 3 = 5.", "diamond"),
  count("dot", [8, 6, 7, 5, 6], 2, "The count alternates −2 and +1.", "circle"),
  cycle(["triangle", "square", "circle"], 3),
  cycle(["star", "hexagon", "diamond"], 3),
  series(
    [[{ shape: "circle" }, { shape: "square" }], [{ shape: "square" }, { shape: "circle" }, { shape: "square" }], [{ shape: "circle" }, { shape: "square" }, { shape: "circle" }, { shape: "square" }]],
    [{ shape: "square" }, { shape: "circle" }, { shape: "square" }, { shape: "circle" }, { shape: "square" }],
    [
      [{ shape: "circle" }, { shape: "square" }, { shape: "circle" }, { shape: "square" }, { shape: "circle" }],
      [{ shape: "square" }, { shape: "circle" }, { shape: "square" }, { shape: "circle" }],
      [{ shape: "square" }, { shape: "square" }, { shape: "circle" }, { shape: "circle" }, { shape: "square" }],
      [{ shape: "square" }, { shape: "circle" }, { shape: "square" }, { shape: "circle" }, { shape: "square" }, { shape: "circle" }],
    ],
    3,
    "Each figure adds one shape, and the first shape switches between circle and square.",
  ),

  orbit(0, 3, 3),
  orbitTurn(0, 1, 90, 2),
  orbitTurn(2, -2, 135, 3),
  series(
    [0, 1, 2, 3].map((index) => [{ shape: "dot", solid: true, cell: at(index) }, { shape: "square", cell: at(3 - index) }]),
    [{ shape: "dot", solid: true, cell: at(4) }, { shape: "square", cell: at(-1) }],
    [
      [{ shape: "dot", solid: true, cell: at(4) }, { shape: "square", cell: at(1) }],
      [{ shape: "dot", solid: true, cell: at(3) }, { shape: "square", cell: at(-1) }],
      [{ shape: "dot", solid: true, cell: at(-1) }, { shape: "square", cell: at(4) }],
      [{ shape: "dot", solid: true, cell: at(5) }, { shape: "square", cell: at(-2) }],
    ],
    3,
    "The dot moves one square clockwise, the square moves one square counterclockwise.",
  ),

  mirrorOdd("flag", [0, 90, 180, 270, 45], 2, 2),
  mirrorOdd("hook", [0, 45, 90, 135, 270], 4, 2),
  mirrorOdd("flag", [30, 150, 210, 300, 120], 1, 3),
  mirrorOdd("hook", [180, 0, 270, 90, 225], 0, 3),
  oddOneOut(
    [0, 90, 180, 270, 45].map((rotation, index) => [
      { shape: "arrow", rotation },
      { shape: "arrow", rotation: rotation + (index === 3 ? -90 : 90) },
    ]),
    3,
    3,
    "In the other figures the second arrow is turned 90° clockwise from the first. Here it is turned counterclockwise.",
  ),
  oddOneOut(
    [
      [1, 2],
      [2, 3],
      [0, 1],
      [2, 2],
      [3, 4],
    ].map(([circles, squares]) => [...repeat({ shape: "circle" }, circles), ...repeat({ shape: "square" }, squares)]),
    3,
    3,
    "In the other figures there is one more square than circles. This one has as many squares as circles.",
  ),
  sidesOdd(
    [
      ["square", "square", "square", "square"],
      ["triangle", "triangle", "square", "hexagon"],
      ["triangle", "square", "pentagon", "pentagon"],
      ["triangle", "triangle", "pentagon", "pentagon"],
      ["triangle", "square", "square", "pentagon"],
    ],
    2,
    3,
  ),
  sidesOdd(
    [
      ["hexagon", "pentagon", "triangle", "triangle"],
      ["hexagon", "square", "square", "triangle"],
      ["pentagon", "pentagon", "square", "triangle"],
      ["hexagon", "hexagon", "triangle", "triangle"],
      ["pentagon", "square", "square", "square"],
    ],
    3,
    3,
  ),

  latinGrid(["circle", "square", "triangle"], 0, false, 2),
  latinGrid(["star", "diamond", "hexagon"], 1, false, 3),
  latinGrid(["cross", "pentagon", "circle"], 2, true, 3),
  latinGrid(["triangle", "hexagon", "square"], 0, true, 3),
  turnGrid("flag", [0, 180, 90], 90, 3),
  turnGrid("hook", [45, 270, 135], 90, 3),
  unionGrid(
    [
      [[0], [8]],
      [[2, 3], [6]],
      [[1, 7], [4]],
    ],
    3,
  ),
  xorGrid(
    [
      [[0, 1, 4], [1, 2, 4]],
      [[3, 4], [4, 5, 8]],
      [[2, 6, 7], [7, 8]],
    ],
    3,
  ),
  xorGrid(
    [
      [[0, 4, 8], [2, 4, 6]],
      [[1, 3], [1, 5, 7]],
      [[0, 2, 5], [2, 3, 8]],
    ],
    3,
  ),
];
