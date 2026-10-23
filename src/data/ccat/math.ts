import type { Difficulty, Question } from "./types";

type Extra = Partial<Pick<Question, "table" | "keepOrder">>;

const problem = (stem: string, options: string[], answer: number, difficulty: Difficulty, explanation: string, extra: Extra = {}): Question => ({
  category: "math",
  kind: "Word problem",
  difficulty,
  prompt: "Solve the problem. No calculator.",
  stem,
  options,
  answer,
  keepOrder: true,
  explanation,
  ...extra,
});

const series = (terms: string, options: string[], answer: number, difficulty: Difficulty, explanation: string): Question => ({
  category: "math",
  kind: "Number series",
  difficulty,
  prompt: "What comes next in the series?",
  stem: `${terms}, ?`,
  options,
  answer,
  keepOrder: true,
  explanation,
});

const letters = (terms: string, options: string[], difficulty: Difficulty, explanation: string): Question => ({
  category: "math",
  kind: "Letter series",
  difficulty,
  prompt: "What comes next in the series?",
  stem: `${terms}, ?`,
  options,
  answer: 0,
  explanation,
});

const verdicts = ["True", "False", "Uncertain"];

const syllogism = (lines: string[], verdict: "True" | "False" | "Uncertain", difficulty: Difficulty, explanation: string): Question => ({
  category: "math",
  kind: "Logic",
  difficulty,
  prompt: "Assume the first statements are true. Is the final statement true, false or uncertain?",
  lines,
  options: verdicts,
  answer: verdicts.indexOf(verdict),
  keepOrder: true,
  explanation,
});

const puzzle = (stem: string, options: string[], difficulty: Difficulty, explanation: string): Question => ({
  category: "math",
  kind: "Logic",
  difficulty,
  prompt: "Solve the problem.",
  stem,
  options,
  answer: 0,
  explanation,
});

export const mathQuestions: Question[] = [
  problem("Three numbers have an average of 20. Two of them are 14 and 25. What is the third number?", ["18", "20", "21", "23", "25"], 2, 1, "The sum is 3 × 20 = 60, so the third number is 60 − 14 − 25 = 21."),
  problem("What is 15% of 240?", ["24", "32", "36", "40", "48"], 2, 1, "10% is 24 and 5% is 12, together 36."),
  problem("A recipe uses 3 cups of flour for 12 cookies. How many cups are needed for 30 cookies?", ["6", "7", "7.5", "8", "9"], 2, 1, "That is 0.25 cups per cookie, and 30 × 0.25 = 7.5."),
  problem("A store sells pens at 3 for $2. How much do 12 pens cost?", ["$6", "$7", "$8", "$9", "$12"], 2, 1, "12 pens are 4 groups of 3, and 4 × $2 = $8."),
  problem("A car uses 6 liters of fuel per 100 km. How many liters does it need for 350 km?", ["18", "20", "21", "24", "35"], 2, 1, "3.5 × 6 = 21 liters."),
  problem("If x + 2x + 3x = 48, what is x?", ["6", "7", "8", "9", "12"], 2, 1, "6x = 48, so x = 8."),
  problem("A team won 18 of its first 24 games. What percentage of games did it win?", ["66%", "70%", "72%", "75%", "80%"], 3, 1, "18 / 24 = 3 / 4 = 75%."),
  problem("Sam reads 25 pages per hour. How many hours does he need for 175 pages?", ["5", "6", "7", "8", "9"], 2, 1, "175 / 25 = 7."),
  problem("How many seconds are in 2.5 hours?", ["900", "1,500", "7,200", "9,000", "15,000"], 3, 1, "2.5 × 60 × 60 = 9,000."),
  problem("A shirt costs $40 after a 20% discount. What was the original price?", ["$44", "$48", "$50", "$52", "$60"], 2, 2, "$40 is 80% of the original price, so the original was $40 / 0.8 = $50."),
  problem("A train travels 180 km in 2 hours 15 minutes. What is its average speed?", ["72 km/h", "75 km/h", "80 km/h", "85 km/h", "90 km/h"], 2, 2, "2 hours 15 minutes is 2.25 hours, and 180 / 2.25 = 80."),
  problem("4 workers paint a fence in 6 hours. How many hours would 3 workers need at the same rate?", ["4.5", "7", "8", "9", "10"], 2, 2, "The job takes 4 × 6 = 24 worker hours, and 24 / 3 = 8."),
  problem("Which of these is the largest?", ["3/5", "5/8", "0.61", "7/12", "0.6"], 1, 2, "5/8 = 0.625 is larger than 0.61, 0.6 and 7/12 ≈ 0.583."),
  problem("A rectangle is 12 m long and has an area of 96 m². What is its perimeter?", ["20 m", "32 m", "36 m", "40 m", "48 m"], 3, 2, "The width is 96 / 12 = 8 m, so the perimeter is 2 × (12 + 8) = 40 m."),
  problem("The ratio of cats to dogs at a shelter is 3:5. There are 40 animals in total. How many are cats?", ["12", "15", "18", "20", "24"], 1, 2, "There are 8 parts of 5 animals each, and cats get 3 parts: 15."),
  problem("What is 0.25 × 0.4?", ["0.01", "0.025", "0.1", "0.65", "1"], 2, 2, "0.25 × 0.4 = 1/4 × 0.4 = 0.1."),
  problem("A jacket costs $120. It is reduced by 25% and then by a further $10. What is the final price?", ["$70", "$75", "$80", "$85", "$90"], 2, 2, "$120 × 0.75 = $90, minus $10 is $80."),
  problem("If 5 notebooks cost $13.75, how much do 8 notebooks cost?", ["$20.00", "$21.50", "$22.00", "$22.75", "$24.00"], 2, 2, "One notebook costs $2.75, and 8 × $2.75 = $22."),
  problem(
    "A stock rises 10% on Monday and falls 10% on Tuesday. How does Tuesday's close compare to Monday's opening price?",
    ["2% lower", "1% lower", "The same", "1% higher", "10% lower"],
    1,
    2,
    "1.1 × 0.9 = 0.99, so the price ends 1% lower.",
  ),
  problem("The table shows weekly hours. What is the average per day?", ["7", "7.5", "8", "8.5", "9"], 2, 1, "The total is 40 hours over 5 days, so 8 per day.", {
    table: [["Mon", "Tue", "Wed", "Thu", "Fri"], ["7", "9", "8", "6", "10"]],
  }),
  problem("In which quarter did sales grow the most compared to the quarter before?", ["Q1", "Q2", "Q3", "Q4"], 3, 2, "Growth was +30 in Q2, +5 in Q3 and +45 in Q4.", {
    table: [["Quarter", "Q1", "Q2", "Q3", "Q4"], ["Sales", "120", "150", "155", "200"]],
  }),
  problem("An order has 3 of product A, 2 of B and 1 of C. What is the total?", ["$32", "$35", "$38", "$41", "$44"], 2, 2, "3 × $4 + 2 × $7 + $12 = $12 + $14 + $12 = $38.", {
    table: [["Product", "A", "B", "C"], ["Price", "$4", "$7", "$12"]],
  }),
  problem("By what percentage did the number of users grow from 2024 to 2025?", ["20%", "25%", "30%", "40%", "50%"], 1, 2, "From 800 to 1,000 is an increase of 200, and 200 / 800 = 25%.", {
    table: [["Year", "2023", "2024", "2025"], ["Users", "600", "800", "1,000"]],
  }),
  problem("Anna is 4 times as old as her son. In 20 years she will be twice as old as him. How old is Anna now?", ["30", "36", "40", "44", "48"], 2, 3, "With son s: 4s + 20 = 2(s + 20), so s = 10 and Anna is 40."),
  problem("One pipe fills a tank in 6 hours, another in 3 hours. How long do they take together?", ["1.5 hours", "2 hours", "2.5 hours", "3 hours", "4.5 hours"], 1, 3, "Together they fill 1/6 + 1/3 = 1/2 of the tank per hour, so 2 hours."),
  problem("A salary of $3,000 is raised by 5% and then by another 10%. What is the new salary?", ["$3,450", "$3,465", "$3,500", "$3,550", "$3,600"], 1, 3, "$3,000 × 1.05 = $3,150, and $3,150 × 1.1 = $3,465."),
  problem("In a class of 30, 18 students play football, 12 play tennis and 5 play both. How many play neither?", ["0", "5", "7", "10", "12"], 1, 3, "18 + 12 − 5 = 25 play at least one, so 30 − 25 = 5 play neither."),
  problem("A cyclist rides 12 km at 24 km/h and then 12 km at 12 km/h. What is the average speed for the whole trip?", ["14 km/h", "16 km/h", "18 km/h", "20 km/h", "22 km/h"], 1, 3, "The trip takes 0.5 + 1 = 1.5 hours for 24 km, so 16 km/h."),
  problem("A number is increased by 20% and the result is 54. What is the number?", ["42", "43.2", "44", "45", "48"], 3, 3, "1.2 × n = 54, so n = 45."),
  problem("Mixing 2 liters of juice at $3 per liter with 3 liters at $8 per liter, what is the price per liter of the mix?", ["$5.00", "$5.50", "$6.00", "$6.50", "$7.00"], 2, 3, "The mix costs $6 + $24 = $30 for 5 liters, so $6 per liter."),

  series("3, 6, 12, 24", ["30", "36", "42", "48", "54"], 3, 1, "Each number doubles."),
  series("2, 5, 9, 14, 20", ["24", "25", "26", "27", "28"], 3, 1, "The steps grow by one: +3, +4, +5, +6, then +7."),
  series("81, 27, 9, 3", ["0", "1", "1.5", "2", "3"], 1, 1, "Each number is divided by 3."),
  series("1, 4, 9, 16, 25", ["30", "32", "35", "36", "49"], 3, 1, "These are the squares 1², 2², 3², 4², 5², then 6² = 36."),
  series("2, 3, 5, 8, 12, 17", ["21", "22", "23", "24", "25"], 2, 1, "The steps are +1, +2, +3, +4, +5, then +6."),
  series("1, 1, 2, 3, 5, 8", ["11", "12", "13", "14", "16"], 2, 2, "Each number is the sum of the two before it: 5 + 8 = 13."),
  series("5, 10, 8, 16, 14", ["12", "18", "24", "28", "32"], 3, 2, "The steps alternate ×2 and −2, so 14 × 2 = 28."),
  series("100, 95, 85, 70, 50", ["20", "25", "30", "35", "40"], 1, 2, "The steps are −5, −10, −15, −20, then −25."),
  series("3, 4, 7, 11, 18, 29", ["40", "43", "45", "47", "51"], 3, 2, "Each number is the sum of the two before it: 18 + 29 = 47."),
  series("1, 2, 6, 24, 120", ["240", "480", "600", "720", "840"], 3, 2, "The multipliers grow: ×2, ×3, ×4, ×5, then ×6."),
  series("4, 9, 19, 39, 79", ["119", "139", "158", "159", "160"], 3, 2, "Each number is doubled plus one: 79 × 2 + 1 = 159."),
  series("2, 6, 3, 9, 6, 18", ["12", "15", "21", "36", "54"], 1, 3, "The steps alternate ×3 and −3, so 18 − 3 = 15."),
  series("64, 32, 48, 24, 36", ["12", "18", "24", "30", "54"], 1, 3, "The steps alternate ÷2 and ×1.5, so 36 ÷ 2 = 18."),
  series("1, 3, 7, 15, 31", ["47", "55", "62", "63", "64"], 3, 3, "Each number is doubled plus one, or 2ⁿ − 1: 31 × 2 + 1 = 63."),

  letters("A, C, E, G", ["I", "H", "J", "K", "L"], 1, "Every second letter: A, C, E, G, I."),
  letters("B, D, G, K", ["P", "N", "O", "Q", "R"], 2, "The steps grow: +2, +3, +4, then +5 from K is P."),
  letters("AZ, BY, CX", ["DW", "DV", "EW", "DX", "EV"], 2, "The first letter moves forward, the second moves backward."),
  letters("Z, X, U, Q", ["L", "K", "M", "N", "O"], 3, "The steps grow backwards: −2, −3, −4, then −5 from Q is L."),
  letters("J, F, M, A, M, J", ["J", "A", "M", "S", "O"], 3, "These are the first letters of the months. After June comes July."),

  syllogism(["All managers attend the meeting.", "Lena is a manager.", "Lena attends the meeting."], "True", 1, "Lena belongs to a group that all attend."),
  syllogism(["No reptiles have fur.", "All snakes are reptiles.", "Some snakes have fur."], "False", 1, "Every snake is a reptile, and no reptile has fur."),
  syllogism(["Tom is taller than Ana.", "Ana is taller than Ben.", "Ben is taller than Tom."], "False", 1, "The order is Tom, Ana, Ben, so Ben is the shortest."),
  syllogism(["Car A is faster than car B.", "Car C is slower than car B.", "Car C is faster than car A."], "False", 1, "The order is A, B, C, so C is the slowest."),
  syllogism(["The red house is left of the blue house.", "The green house is right of the blue house.", "The green house is left of the red house."], "False", 1, "From left to right the order is red, blue, green."),
  syllogism(["All roses are flowers.", "Some flowers fade quickly.", "Some roses fade quickly."], "Uncertain", 2, "The flowers that fade quickly may or may not include roses."),
  syllogism(["Every file on the server is encrypted.", "Some encrypted files are backups.", "Some files on the server are backups."], "Uncertain", 2, "The encrypted backups could be stored somewhere else."),
  syllogism(["All engineers in the team know Python.", "Mia does not know Python.", "Mia is an engineer in the team."], "False", 2, "If Mia were in the team, she would know Python."),
  syllogism(["Some analysts are programmers.", "All programmers use Git.", "Some analysts use Git."], "True", 2, "The analysts who are programmers use Git."),
  syllogism(["Lisa earns more than Omar.", "Omar earns more than Kim.", "Paul earns more than Lisa.", "Kim earns less than Paul."], "True", 2, "The order is Paul, Lisa, Omar, Kim."),
  syllogism(["All birds lay eggs.", "Penguins lay eggs.", "Penguins are birds."], "Uncertain", 3, "Other animals could lay eggs too. Judge only from the statements, not from what you know."),
  syllogism(["No auditors are interns.", "Some interns are students.", "Some students are not auditors."], "True", 3, "The students who are interns cannot be auditors."),

  puzzle("Ken is older than Lea. Max is younger than Lea. Nia is older than Ken. Who is the youngest?", ["Max", "Ken", "Lea", "Nia", "Cannot be determined"], 1, "The order is Nia, Ken, Lea, Max."),
  puzzle("In a code, CAT is written as DBU. How is DOG written?", ["EPH", "DPH", "EOH", "CNF", "FQI"], 1, "Each letter moves one step forward."),
  puzzle(
    "Hana finished a race first. Dana finished after Finn but before Eli. Gus finished after Eli. Who finished third?",
    ["Dana", "Eli", "Finn", "Gus", "Hana"],
    2,
    "After Hana come Finn, Dana, Eli and Gus in that order.",
  ),
  puzzle("If today is Wednesday, what day is it 100 days from now?", ["Friday", "Thursday", "Saturday", "Sunday", "Monday"], 2, "100 = 14 weeks + 2 days, and two days after Wednesday is Friday."),
  puzzle(
    "Four books stand on a shelf. The red book is directly left of the blue book. The green book is at the far right. The yellow book is not next to the green book. Which book is second from the left?",
    ["Red", "Blue", "Green", "Yellow", "Cannot be determined"],
    3,
    "Yellow cannot be third, so the order is yellow, red, blue, green.",
  ),
  puzzle("What is the angle between the hands of a clock at 4:30?", ["45°", "30°", "60°", "75°", "90°"], 3, "The minute hand is at 180°, the hour hand halfway between 4 and 5 at 135°."),
];
