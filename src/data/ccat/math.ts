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

const conclusion = (stem: string, options: string[], difficulty: Difficulty, explanation: string): Question => ({
  category: "math",
  kind: "Logic",
  difficulty,
  prompt: "Assume the statements are true. Which conclusion must be true?",
  stem,
  options,
  answer: 0,
  explanation,
});

export const mathQuestions: Question[] = [
  problem("A train travels 180 km in 2 hours 15 minutes. What is its average speed?", ["72 km/h", "75 km/h", "80 km/h", "85 km/h", "90 km/h"], 2, 2, "2 hours 15 minutes is 2.25 hours, and 180 / 2.25 = 80."),
  problem(
    "A stock rises 10% on Monday and falls 10% on Tuesday. How does Tuesday's close compare to Monday's opening price?",
    ["2% lower", "1% lower", "The same", "1% higher", "10% lower"],
    1,
    2,
    "1.1 × 0.9 = 0.99, so the price ends 1% lower.",
  ),
  problem("By what percentage did the number of users grow from 2023 to 2025?", ["40%", "50%", "60%", "66.7%", "75%"], 3, 2, "From 600 to 1,000 is an increase of 400, and 400 / 600 = 66.7%.", {
    table: [["Year", "2023", "2024", "2025"], ["Users", "600", "800", "1,000"]],
  }),
  problem("Which product earned the most revenue per unit sold?", ["A", "B", "C", "D"], 3, 3, "Per unit: A $25, B $30, C $22, D $33.", {
    table: [["Product", "A", "B", "C", "D"], ["Units", "120", "80", "150", "60"], ["Revenue", "$3,000", "$2,400", "$3,300", "$1,980"]],
  }),
  problem("Anna is 4 times as old as her son. In 20 years she will be twice as old as him. How old is Anna now?", ["30", "36", "40", "44", "48"], 2, 3, "With son s: 4s + 20 = 2(s + 20), so s = 10 and Anna is 40."),
  problem("A number is increased by 20% and the result is 54. What is the number?", ["42", "43.2", "44", "45", "48"], 3, 3, "1.2 × n = 54, so n = 45."),
  problem("Mixing 2 liters of juice at $3 per liter with 3 liters at $8 per liter, what is the price per liter of the mix?", ["$5.00", "$5.50", "$6.00", "$6.50", "$7.00"], 2, 3, "The mix costs $6 + $24 = $30 for 5 liters, so $6 per liter."),
  problem("A warehouse has 240 boxes. Three-eighths are shipped in the morning, then one-third of the remaining boxes in the afternoon. How many boxes remain?", ["80", "90", "100", "110", "120"], 2, 2, "3/8 of 240 is 90, leaving 150. One third of 150 is 50, leaving 100."),
  problem("5 machines make 5 parts in 5 minutes. How many parts do 10 machines make in 10 minutes?", ["10", "15", "20", "50", "100"], 2, 2, "Each machine makes one part in 5 minutes, so two in 10 minutes. 10 machines make 20."),
  problem("A train travels 180 miles in 3 hours. At the same rate, how far does it travel in 50 minutes?", ["40 miles", "45 miles", "50 miles", "55 miles", "60 miles"], 2, 2, "60 miles per hour, and 50 minutes is 5/6 of an hour: 50 miles."),
  problem("A tank is 3/5 full. After 24 liters are added it is full. What is its capacity?", ["40 L", "48 L", "54 L", "60 L", "72 L"], 3, 2, "The missing 2/5 is 24 liters, so 1/5 is 12 and the tank holds 60."),
  problem("7 identical pumps fill 14 tanks in 6 hours. How many tanks do 3 pumps fill in 7 hours?", ["5", "6", "7", "8", "9"], 2, 3, "Each pump fills 1/3 tank per hour. 3 pumps × 7 hours = 21 pump hours = 7 tanks."),
  problem("A mixture holds water and concentrate at 5:2. After 9 liters of concentrate are added, the ratio is 5:3. How many liters of water are there?", ["30", "36", "40", "45", "50"], 3, 3, "With 5k water and 2k concentrate: 5k / (2k + 9) = 5/3 gives k = 9, so 45 liters."),
  problem("Pump A fills a tank in 4 hours, pump B in 6 hours, and a drain empties it in 3 hours. All three start on an empty tank. When is it half full?", ["2 hours", "4 hours", "5 hours", "6 hours", "8 hours"], 3, 3, "Per hour: 1/4 + 1/6 − 1/3 = 1/12, so half the tank takes 6 hours."),
  problem("A clock is set right at midnight and gains 7 minutes every 3 hours. What does it show after exactly 180 real hours?", ["7:00 AM", "12:00 PM", "5:00 PM", "7:00 PM", "8:00 PM"], 3, 3, "180 hours is 7.5 days, so the real time is noon. The clock gained 60 × 7 = 420 minutes, 7 hours: 7:00 PM."),
  problem("4 workers build 4 walls in 4 days. How many days do 6 workers need for 9 walls?", ["4", "6", "8", "9", "12"], 1, 3, "One wall takes 4 worker days. 9 walls take 36 worker days, and 36 / 6 = 6."),
  problem("An item sells at a 20% profit. Selling it for $48 more would give a 35% profit. What did it cost?", ["$240", "$300", "$320", "$360", "$400"], 2, 3, "The extra 15% of the cost is $48, so the cost is $320."),
  problem("How many liters of pure alcohol must be added to 40 liters of a 25% solution to make it 40%?", ["6", "8", "10", "12", "15"], 2, 3, "(10 + x) / (40 + x) = 0.4 gives x = 10."),
  problem("A bag holds 4 red, 5 blue and 3 green marbles. Three are drawn without replacement. What is the probability that all three colors are drawn?", ["1/11", "2/11", "1/4", "3/11", "5/11"], 3, 3, "4 × 5 × 3 = 60 good draws out of 220 possible, which is 3/11."),
  problem("A bag holds 3 red and 5 blue balls. The first ball drawn is blue. What is the chance the second is red?", ["2/7", "3/8", "3/7", "1/2", "5/8"], 2, 2, "7 balls are left and 3 of them are red."),
  problem("The average of 5 numbers is 20. After one is removed, the average of the rest is 18. Which number was removed?", ["22", "24", "26", "28", "30"], 3, 2, "The total drops from 100 to 72, so the number was 28."),
  problem("What is the largest number of pieces a round pizza can be cut into with 4 straight cuts?", ["8", "9", "10", "11", "16"], 3, 3, "Each new cut can cross all earlier cuts: 2, 4, 7, then 11."),
  problem("Tom is twice as old as Jerry. In 5 years Tom will be 1.5 times as old as Jerry. How old is Tom now?", ["8", "10", "12", "14", "15"], 1, 2, "2J + 5 = 1.5(J + 5) gives J = 5, so Tom is 10."),
  problem("A car worth $20,000 loses 15% of its value each year. What is it worth after 2 years?", ["$13,000", "$14,000", "$14,450", "$14,500", "$15,000"], 2, 3, "$20,000 × 0.85 × 0.85 = $14,450."),
  problem("Of 30 people, 18 play football and 15 play basketball. At least how many play both?", ["0", "3", "5", "7", "15"], 1, 2, "18 + 15 = 33 is 3 more than 30, so at least 3 must play both."),
  problem("70% like tea, 55% like coffee, 35% like both and 10% like neither. What percentage like only coffee?", ["10%", "15%", "20%", "25%", "30%"], 2, 2, "55% like coffee and 35% of them also like tea, so 20% like only coffee."),
  problem("82% passed math, 68% passed science and 55% passed both. What percentage passed at least one?", ["86%", "90%", "95%", "97%", "100%"], 2, 2, "82 + 68 − 55 = 95."),
  problem("A price is cut by 50% and then raised by 50%. What is the final price?", ["50% of the original", "75% of the original", "87.5% of the original", "100% of the original", "125% of the original"], 1, 2, "0.5 × 1.5 = 0.75."),
  problem("Which is smallest?", ["7/10", "68%", "0.72", "2/3", "0.69"], 3, 2, "2/3 is about 0.667, below 0.68."),
  problem("Which is greatest?", ["0.74", "73%", "3/4", "0.749", "7/10"], 2, 2, "3/4 is 0.75, just above 0.749."),

  series("5, 10, 8, 16, 14", ["12", "18", "24", "28", "32"], 3, 2, "The steps alternate ×2 and −2, so 14 × 2 = 28."),
  series("4, 9, 19, 39, 79", ["119", "139", "158", "159", "160"], 3, 2, "Each number is doubled plus one: 79 × 2 + 1 = 159."),
  series("4, 7, 13, 25, 49", ["73", "81", "91", "97", "99"], 3, 2, "The steps double: +3, +6, +12, +24, then +48."),
  series("1, 4, 10, 22, 46", ["70", "82", "90", "94", "96"], 3, 2, "Each number is doubled plus two: 46 × 2 + 2 = 94."),
  series("2, 3, 5, 9, 17", ["25", "31", "33", "34", "35"], 2, 2, "The steps double: +1, +2, +4, +8, then +16."),
  series("3, 10, 24, 52, 108", ["212", "216", "220", "224", "228"], 2, 3, "Each number is doubled plus four: 108 × 2 + 4 = 220."),
  series("1, 2, 5, 12, 29, 70", ["140", "141", "169", "170", "199"], 2, 3, "Each number is twice the one before plus the one before that: 2 × 70 + 29 = 169."),
  series("2, 6, 15, 31, 56, 92", ["128", "135", "141", "145", "148"], 2, 3, "The steps are the squares 4, 9, 16, 25, 36, then 49."),
  series("5, 12, 27, 58, 121", ["242", "244", "246", "248", "250"], 3, 3, "Doubled plus 2, 3, 4, 5, then 6: 121 × 2 + 6 = 248."),
  series("1, 5, 14, 30, 55", ["80", "85", "89", "91", "96"], 3, 3, "Add the squares 4, 9, 16, 25, then 36."),
  series("2, 10, 30, 68, 130", ["192", "210", "216", "222", "226"], 3, 3, "Each term is n³ + n: 6³ + 6 = 222."),
  series("1, 4, 27, 256, 3125", ["15625", "18750", "31250", "46656", "279936"], 3, 3, "Each term is nⁿ: 6⁶ = 46,656."),

  letters("B, D, G, K", ["P", "N", "O", "Q", "R"], 2, "The steps grow: +2, +3, +4, then +5 from K is P."),
  letters("A, C, F, J, O", ["U", "S", "T", "V", "W"], 2, "The steps grow: +2, +3, +4, +5, then +6 from O is U."),
  letters("Z, X, U, Q", ["L", "K", "M", "N", "O"], 3, "The steps grow backwards: −2, −3, −4, then −5 from Q is L."),
  letters("Z, W, S, N, H", ["A", "B", "C", "D", "E"], 3, "The steps grow backwards: −3, −4, −5, −6, then −7 from H is A."),
  letters("J, F, M, A, M, J", ["J", "A", "M", "S", "O"], 3, "These are the first letters of the months. After June comes July."),
  letters("A3, C6, E12, G24", ["I48", "H48", "I36", "J48", "I44"], 2, "The letters skip one and the numbers double."),
  letters("C1, D4, E9, F16", ["G25", "G20", "H25", "F25", "G36"], 2, "The letters move on by one and the numbers are squares."),

  syllogism(["All roses are flowers.", "Some flowers fade quickly.", "Some roses fade quickly."], "Uncertain", 2, "The flowers that fade quickly may or may not include roses."),
  syllogism(["Every file on the server is encrypted.", "Some encrypted files are backups.", "Some files on the server are backups."], "Uncertain", 2, "The encrypted backups could be stored somewhere else."),
  syllogism(["All engineers in the team know Python.", "Mia does not know Python.", "Mia is an engineer in the team."], "False", 2, "If Mia were in the team, she would know Python."),
  syllogism(["Some analysts are programmers.", "All programmers use Git.", "Some analysts use Git."], "True", 2, "The analysts who are programmers use Git."),
  syllogism(["Lisa earns more than Omar.", "Omar earns more than Kim.", "Paul earns more than Lisa.", "Kim earns less than Paul."], "True", 2, "The order is Paul, Lisa, Omar, Kim."),
  syllogism(["All birds lay eggs.", "Penguins lay eggs.", "Penguins are birds."], "Uncertain", 3, "Other animals could lay eggs too. Judge only from the statements, not from what you know."),
  syllogism(["No auditors are interns.", "Some interns are students.", "Some students are not auditors."], "True", 3, "The students who are interns cannot be auditors."),
  syllogism(["If it rains, the grass gets wet.", "The grass is wet.", "It rained."], "Uncertain", 2, "Something else could have made the grass wet."),
  syllogism(["If it is Monday, Ava works late.", "Ava is not working late.", "It is Monday."], "False", 2, "If it were Monday she would be working late."),
  syllogism(["All but 2 of the 10 apples are rotten.", "At least 3 of the apples are not rotten."], "False", 2, "Exactly 2 apples are not rotten."),

  conclusion("All zorps are mibs. No mibs are tavs.", ["No zorps are tavs.", "Some zorps are tavs.", "All tavs are zorps.", "Some tavs are mibs.", "No tavs exist."], 2, "Every zorp is a mib, and no mib is a tav."),
  conclusion("No pels are daxes. Some daxes are nims.", ["Some nims are not pels.", "All nims are pels.", "No nims are pels.", "Some pels are nims.", "All daxes are nims."], 3, "The daxes that are nims cannot be pels."),
  conclusion("Every kel is a rin. Some rins are faps.", ["None of these must be true.", "Some kels are faps.", "No kels are faps.", "Every fap is a rin.", "Some faps are kels."], 3, "The rins that are faps may or may not include kels."),
  conclusion("No vims are lors. All tegs are vims. Some tegs are pons.", ["Some pons are not lors.", "All pons are vims.", "Some lors are pons.", "No pons are lors.", "All vims are tegs."], 3, "The pons that are tegs are vims, and no vim is a lor."),
  conclusion("No athlete is lazy. All lazy people are unhappy. Some workers are lazy.", ["Some workers are not athletes.", "All workers are unhappy.", "Some athletes are unhappy.", "No workers are athletes.", "Some unhappy people are athletes."], 3, "The lazy workers cannot be athletes."),
  conclusion("All poets are dreamers. No dreamers are practical. Some practical people are engineers.", ["Some engineers are not poets.", "No poets are engineers.", "All engineers are practical.", "Some dreamers are engineers.", "Some poets are practical."], 3, "The practical engineers are not dreamers, so they are not poets."),
  conclusion("All glips are glops. No glops are glatzes. Some glatzes are glunths.", ["Some glunths are not glips.", "No glips are glunths.", "All glunths are glops.", "Some glips are glatzes.", "No glunths are glips."], 3, "The glunths that are glatzes are not glops, so they are not glips."),
  conclusion("All winners trained hard. No lazy person trained hard. Some students are lazy.", ["Some students did not win.", "No students won.", "All winners are students.", "Some lazy people won.", "Some winners are lazy."], 3, "The lazy students did not train hard, so they did not win."),

  puzzle(
    "Hana finished a race first. Dana finished after Finn but before Eli. Gus finished after Eli. Who finished third?",
    ["Dana", "Eli", "Finn", "Gus", "Hana"],
    2,
    "After Hana come Finn, Dana, Eli and Gus in that order.",
  ),
  puzzle(
    "Four books stand on a shelf. The red book is directly left of the blue book. The green book is at the far right. The yellow book is not next to the green book. Which book is second from the left?",
    ["Red", "Blue", "Green", "Yellow", "Cannot be determined"],
    3,
    "Yellow cannot be third, so the order is yellow, red, blue, green.",
  ),
  puzzle("What is the angle between the hands of a clock at 4:30?", ["45°", "30°", "60°", "75°", "90°"], 3, "The minute hand is at 180°, the hour hand halfway between 4 and 5 at 135°."),
  puzzle("In a code, TRAIN is written as UTDMS. How is PLANE written?", ["QNDRJ", "QNDRI", "QMDRJ", "QNCRJ", "RNDRJ"], 3, "The first letter moves 1 step, the second 2, the third 3, the fourth 4 and the fifth 5."),
  puzzle("Five folders stand in a row. P is left of Q. R is right of Q. S is left of P. T is right of R. Which folder is in the middle?", ["Q", "P", "R", "S", "T"], 2, "The order is S, P, Q, R, T."),
  puzzle("A is north of B. C is east of B. D is south of C. In which direction is A from D?", ["Northwest", "Northeast", "Southwest", "Southeast", "North"], 2, "A is both north and west of D."),
  puzzle("Ana is Ben's sister. Cara is Ben's mother. Dan is Cara's father. What is Dan to Ana?", ["Grandfather", "Father", "Uncle", "Brother", "Great-grandfather"], 2, "Dan is the father of Ana's mother."),
  puzzle(
    "Three boxes hold apples, oranges and a mix of both, and every label is wrong. You take one fruit from the box labeled Mixed and it is an apple. What is in that box?",
    ["Only apples", "Only oranges", "Apples and oranges", "Nothing", "Cannot be determined"],
    3,
    "The Mixed label is wrong, so the box holds one kind of fruit, and you drew an apple.",
  ),
  puzzle("On an island, knights always tell the truth and knaves always lie. A says: \"We are both knaves.\" What are A and B?", ["A is a knave, B is a knight", "Both are knights", "Both are knaves", "A is a knight, B is a knave", "Cannot be determined"], 3, "A knight could not say it, so A is a knave and the statement is false, which makes B a knight."),
  puzzle("Knights always tell the truth and knaves always lie. A says: \"B is a knight.\" B says: \"A and I are different types.\" What are they?", ["Both are knaves", "Both are knights", "A is a knight, B is a knave", "A is a knave, B is a knight", "Cannot be determined"], 3, "If A were a knight, B would be a knight who lies. So A is a knave, B is a knave, and B's claim is false."),
  puzzle("Which number does not belong? 8, 27, 64, 100, 125", ["100", "8", "27", "64", "125"], 2, "The others are cubes: 2³, 3³, 4³ and 5³."),
];
