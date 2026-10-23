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

const contentsOdd = (shapes: Shape[], swap: Shape, orders: number[][], odd: number, difficulty: Difficulty) =>
  oddOneOut(
    orders.map((order, index) => {
      const figure = order.map((position) => ({ shape: shapes[position] }));
      return index === odd ? figure.map((glyph) => (glyph.shape === shapes[1] ? { shape: swap } : glyph)) : figure;
    }),
    odd,
    difficulty,
    `Every other figure contains a ${shapes.join(", a ")}. This one has a second ${swap} instead of the ${shapes[1]}.`,
  );

const grid = (cell: (row: number, column: number) => Figure) => Array.from({ length: 9 }, (_, index) => cell(Math.floor(index / 3), index % 3));

const countGrid = (shapes: Shape[], difficulty: Difficulty) => {
  const cells = grid((row, column) => repeat({ shape: shapes[row] }, column + 1));
  return matrix(
    cells,
    [repeat({ shape: shapes[2] }, 2), repeat({ shape: shapes[1] }, 3), repeat({ shape: shapes[2] }, 4), repeat({ shape: shapes[0] }, 3), repeat({ shape: shapes[2], solid: true }, 3)],
    difficulty,
    "Each row keeps its shape and each column adds one more.",
  );
};

const latinGrid = (shapes: Shape[], solidColumn: number, difficulty: Difficulty) => {
  const cells = grid((row, column) => [{ shape: shapes[(row + column) % 3], solid: column === solidColumn }]);
  const answer = cells[8][0];
  return matrix(
    cells,
    [[{ ...answer, solid: !answer.solid }], [{ shape: shapes[0], solid: answer.solid }], [{ shape: shapes[2], solid: answer.solid }], [{ shape: shapes[0], solid: !answer.solid }]],
    difficulty,
    `Each row and column holds every shape once, and only the ${["first", "second", "third"][solidColumn]} column is filled.`,
  );
};

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

export const spatialQuestions: Question[] = [
  turn("arrow", 0, 45, 1),
  turn("arrow", 90, 90, 1),
  turn("clock", 0, 30, 1),
  turn("half", 0, 45, 2),
  turn("triangle", 0, 20, 2),
  turn("flag", 0, 90, 2),
  turn("hook", 0, -90, 2),
  turn("flag", 45, 45, 2, { solid: true }),
  turn("arrow", 0, 135, 3),
  turn("clock", 0, 135, 3),
  turn("hook", 90, 135, 3),

  count("circle", [1, 2, 3, 4, 5], 1, "One more circle each step.", "square"),
  count("square", [1, 3, 5, 7, 9], 1, "Two more squares each step.", "diamond"),
  count("star", [9, 7, 5, 3, 1], 1, "Two fewer stars each step.", "cross"),
  count("triangle", [1, 1, 2, 3, 5], 2, "Each count is the sum of the two before it: 2 + 3 = 5.", "diamond"),
  count("dot", [8, 6, 7, 5, 6], 2, "The count alternates −2 and +1.", "circle"),

  series(
    [[{ shape: "triangle" }], [{ shape: "square", solid: true }], [{ shape: "pentagon" }]],
    [{ shape: "hexagon", solid: true }],
    [[{ shape: "hexagon" }], [{ shape: "pentagon", solid: true }], [{ shape: "star", solid: true }], [{ shape: "circle", solid: true }]],
    2,
    "Each shape has one more side, and the fill alternates.",
  ),
  series(
    [[{ shape: "arrow" }], [{ shape: "arrow", rotation: 90, solid: true }], [{ shape: "arrow", rotation: 180 }], [{ shape: "arrow", rotation: 270, solid: true }]],
    [{ shape: "arrow" }],
    [[{ shape: "arrow", solid: true }], [{ shape: "arrow", rotation: 90 }], [{ shape: "arrow", rotation: 180 }], [{ shape: "arrow", rotation: 270, solid: true }]],
    2,
    "The arrow turns 90° clockwise each step and the fill alternates.",
  ),
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

  orbit(0, 1, 1),
  orbit(5, -2, 2),
  orbit(1, 2, 2),
  orbit(0, 3, 3),
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
  contentsOdd(["circle", "triangle", "square"], "square", [[0, 1, 2], [2, 0, 1], [1, 2, 0], [0, 2, 1], [2, 1, 0]], 1, 1),
  contentsOdd(["star", "diamond", "cross"], "cross", [[1, 0, 2], [0, 1, 2], [2, 1, 0], [1, 2, 0], [0, 2, 1]], 3, 1),
  oddOneOut(
    [
      [{ shape: "circle", solid: true }, { shape: "circle" }, { shape: "circle", solid: true }, { shape: "circle" }],
      [{ shape: "circle" }, { shape: "circle", solid: true }, { shape: "circle", solid: true }, { shape: "circle" }],
      [{ shape: "circle", solid: true }, { shape: "circle", solid: true }, { shape: "circle" }, { shape: "circle", solid: true }],
      [{ shape: "circle" }, { shape: "circle" }, { shape: "circle", solid: true }, { shape: "circle", solid: true }],
      [{ shape: "circle", solid: true }, { shape: "circle" }, { shape: "circle" }, { shape: "circle", solid: true }],
    ],
    2,
    2,
    "Every other figure has exactly two filled circles. This one has three.",
  ),
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
  oddOneOut(
    [0, 60, 150, 240, 330].map((rotation, index) => [{ shape: "clock", rotation }, { shape: index === 1 ? "square" : "circle", solid: true }]),
    1,
    1,
    "Every other figure pairs the clock with a filled circle.",
  ),

  countGrid(["circle", "square", "triangle"], 1),
  countGrid(["star", "diamond", "hexagon"], 1),
  latinGrid(["circle", "square", "triangle"], 1, 2),
  latinGrid(["cross", "star", "pentagon"], 2, 2),
  latinGrid(["hexagon", "diamond", "circle"], 0, 2),
  turnGrid("arrow", [0, 90, 180], 45, 2),
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
  unionGrid(
    [
      [[0, 2], [4]],
      [[3], [5, 7]],
      [[6, 8], [1, 4]],
    ],
    3,
  ),
];
