import type { CaseItem, CaseSet } from "./types";

export const round = (value: number, decimals = 0) => Math.round(value * 10 ** decimals) / 10 ** decimals;

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

const growth = (from: number, to: number) => ((to - from) / from) * 100;

const money = (value: number) => `£${value.toLocaleString("en-GB", { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

const pick = (prompt: string, options: string[], correct: string, explanation: string): CaseItem => ({ format: "pick", prompt, options, answer: options.indexOf(correct), explanation });

const typed = (prompt: string, answer: number, decimals: number, unit: string | undefined, explanation: string): CaseItem => ({ format: "type", prompt, answer: round(answer, decimals), decimals, unit, explanation });

const rank = (prompt: string, entries: [string, number][], explanation: string): CaseItem => ({
  format: "rank",
  prompt,
  items: entries.map(([label]) => label),
  order: entries.map((_, index) => index).sort((a, b) => entries[b][1] - entries[a][1]),
  explanation,
});

const regions: [string, number, number][] = [
  ["North", 420, 483],
  ["South", 610, 640],
  ["East", 350, 392],
  ["West", 280, 266],
  ["Scotland", 190, 228],
];
const regionGrowth = regions.map(([name, from, to]) => [name, growth(from, to)] as [string, number]);
const fastest = [...regionGrowth].sort((a, b) => b[1] - a[1])[0];

const hours: [string, number][] = [
  ["Amira", 36],
  ["Ben", 42],
  ["Chloe", 28],
  ["Dev", 45],
  ["Ella", 39],
];
const totalHours = sum(hours.map(([, value]) => value));
const rate = 85;
const seniorRate = 110;
const projectCost = (totalHours - 45) * rate + 45 * seniorRate;

const rates = { EUR: 1.15, USD: 1.25, CHF: 1.12 };
const expenses: [string, keyof typeof rates, number][] = [
  ["Hotel", "EUR", 690],
  ["Flights", "USD", 850],
  ["Client dinner", "CHF", 224],
];
const inPounds = expenses.map(([name, currency, amount]) => [name, amount / rates[currency]] as [string, number]);

const surveyed = 1200;

const costs = { Staff: [120, 125, 130, 140], IT: [40, 38, 45, 52], Office: [30, 30, 30, 30] };
const quarterTotals = [0, 1, 2, 3].map((quarter) => costs.Staff[quarter] + costs.IT[quarter] + costs.Office[quarter]);

const visits: [string, number][] = [
  ["Jan", 80],
  ["Feb", 72],
  ["Mar", 90],
  ["Apr", 108],
  ["May", 117],
  ["Jun", 99],
];
const conversion = 0.025;
const falls = visits.slice(1).map(([month, value], index) => [month, visits[index][1] - value] as [string, number]);
const biggestFall = [...falls].sort((a, b) => b[1] - a[1])[0];

const plans = { Basic: 12, Pro: 20, Enterprise: 18 };
const annualDiscount = 0.15;

const departments: [string, number, number][] = [
  ["Audit", 240, 45],
  ["Tax", 160, 55],
  ["Consulting", 300, 40],
  ["Advisory", 100, 50],
];
const headcount = sum(departments.map(([, people]) => people));
const women = sum(departments.map(([, people, share]) => (people * share) / 100));

export const numericalSets: CaseSet[] = [
  {
    section: "numerical",
    title: "Regional revenue",
    context: ["Your manager asks you to check the regional figures before the board pack goes out. All figures are in £ thousands."],
    table: [["Region", "2024", "2025"], ...regions.map(([name, from, to]) => [name, String(from), String(to)])],
    items: [
      typed("By what percentage did revenue in the North grow from 2024 to 2025? Give your answer to one decimal place.", growth(420, 483), 1, "%", "(483 − 420) / 420 = 15.0%."),
      rank("Rank the regions by 2025 revenue, highest first.", regions.map(([name, , to]) => [name, to]), "South 640, North 483, East 392, West 266, Scotland 228."),
      pick("Which region had the largest percentage growth?", regions.map(([name]) => name), fastest[0], `Scotland grew ${round(fastest[1], 1)}%, more than North at 15.0% and East at 12.0%.`),
      typed("What was the total 2025 revenue of all regions, in £ thousands?", sum(regions.map(([, , to]) => to)), 0, "£k", "483 + 640 + 392 + 266 + 228 = 2,009."),
    ],
  },
  {
    section: "numerical",
    title: "Project hours",
    context: [`The chart shows the hours each team member booked to a client project last month. Everyone is billed at £${rate} per hour, except Dev, who is senior and billed at £${seniorRate} per hour.`],
    chart: { title: "Hours booked", unit: "hours", bars: hours.map(([label, value]) => ({ label, value })) },
    items: [
      typed("How much was billed for Ben's hours, in £?", 42 * rate, 0, "£", `42 × £${rate} = £3,570.`),
      pick("What share of all hours did Dev book, to the nearest whole percent?", ["21%", "22%", "24%", "25%", "27%"], `${round((45 / totalHours) * 100)}%`, `45 / ${totalHours} = 23.7%, so 24%.`),
      typed("What was the total amount billed for the project, in £?", projectCost, 0, "£", `${totalHours - 45} × £${rate} + 45 × £${seniorRate} = £12,325 + £4,950 = ${money(projectCost)}.`),
      rank("Rank the team members by hours booked, most first.", hours, "Dev 45, Ben 42, Ella 39, Amira 36, Chloe 28."),
    ],
  },
  {
    section: "numerical",
    title: "Travel expenses",
    context: [
      "You are checking the expenses from a client trip. Convert each amount to pounds.",
      `Exchange rates per £1: ${rates.EUR} EUR, ${rates.USD} USD, ${rates.CHF} CHF.`,
    ],
    table: [["Expense", "Amount"], ...expenses.map(([name, currency, amount]) => [name, `${amount} ${currency}`])],
    items: [
      typed("How much did the hotel cost in £?", 690 / rates.EUR, 0, "£", `690 / ${rates.EUR} = £600.`),
      typed("How much did the flights cost in £?", 850 / rates.USD, 0, "£", `850 / ${rates.USD} = £680.`),
      pick("Which expense cost the most in pounds?", expenses.map(([name]) => name), [...inPounds].sort((a, b) => b[1] - a[1])[0][0], "Flights £680, hotel £600, client dinner £200."),
      typed("What did the trip cost in total, in £?", sum(inPounds.map(([, value]) => value)), 0, "£", "£600 + £680 + £200 = £1,480."),
    ],
  },
  {
    section: "numerical",
    title: "Customer survey",
    context: [`A client surveyed ${surveyed.toLocaleString("en-GB")} customers. 45% were satisfied, 30% neutral and 25% dissatisfied. Of the dissatisfied customers, 40% named delivery times as the main reason.`],
    items: [
      typed("How many customers were satisfied?", surveyed * 0.45, 0, undefined, "45% of 1,200 = 540."),
      typed("How many customers named delivery times as the main reason?", surveyed * 0.25 * 0.4, 0, undefined, "25% of 1,200 = 300 dissatisfied, and 40% of 300 = 120."),
      pick("Next year the client wants 15% dissatisfied, with the same number surveyed. How many fewer dissatisfied customers is that?", ["100", "120", "150", "180", "200"], String(round(surveyed * 0.25 - surveyed * 0.15)), "300 now and 180 at 15%, so 120 fewer."),
      pick("What is the ratio of satisfied to dissatisfied customers?", ["9:5", "5:3", "2:1", "3:2", "9:4"], "9:5", "45:25 simplifies to 9:5."),
    ],
  },
  {
    section: "numerical",
    title: "Quarterly costs",
    context: ["The finance team sent the costs for last year. All figures are in £ thousands."],
    table: [["Cost", "Q1", "Q2", "Q3", "Q4"], ...Object.entries(costs).map(([name, values]) => [name, ...values.map(String)])],
    items: [
      typed("What were the total costs in Q4, in £ thousands?", quarterTotals[3], 0, "£k", "140 + 52 + 30 = 222."),
      typed("What percentage of Q1 costs was spent on IT? Give your answer to one decimal place.", (costs.IT[0] / quarterTotals[0]) * 100, 1, "%", "40 / 190 = 21.1%."),
      rank("Rank the quarters by total cost, highest first.", quarterTotals.map((total, quarter) => [`Q${quarter + 1}`, total]), "Q4 222, Q3 205, Q2 193, Q1 190."),
      pick("What was the average quarterly IT cost?", ["£42.50k", "£43.75k", "£44.00k", "£45.25k", "£46.00k"], `£${(sum(costs.IT) / 4).toFixed(2)}k`, "(40 + 38 + 45 + 52) / 4 = 175 / 4 = 43.75."),
    ],
  },
  {
    section: "numerical",
    title: "Website traffic",
    context: [`The chart shows monthly visits to a client's online shop, in thousands. On average ${conversion * 100}% of visits end in a sale.`],
    chart: { title: "Visits", unit: "thousand", bars: visits.map(([label, value]) => ({ label, value })) },
    items: [
      typed("By what percentage did visits rise from March to April?", growth(90, 108), 0, "%", "(108 − 90) / 90 = 20%."),
      typed("How many sales were made in May?", 117000 * conversion, 0, undefined, "117,000 × 2.5% = 2,925."),
      pick("Which month had the biggest fall in visits compared to the month before?", falls.map(([month]) => month), biggestFall[0], "June fell by 18 thousand, February by 8 thousand."),
      typed("What was the average number of monthly visits, in thousands? Give your answer to one decimal place.", sum(visits.map(([, value]) => value)) / visits.length, 1, "thousand", "566 / 6 = 94.3."),
    ],
  },
  {
    section: "numerical",
    title: "Software pricing",
    context: [
      `A client is choosing a software plan. Basic costs £${plans.Basic}, Pro £${plans.Pro} and Enterprise £${plans.Enterprise} per user per month. Enterprise needs at least 50 users.`,
      `Paying for a full year up front gives ${annualDiscount * 100}% off.`,
    ],
    items: [
      typed("What does Pro cost per year for 30 users paying up front, in £?", 30 * plans.Pro * 12 * (1 - annualDiscount), 0, "£", "30 × £20 × 12 = £7,200, minus 15% = £6,120."),
      pick("A client with 50 users pays monthly. How much per month do they save by choosing the cheaper of Pro and Enterprise?", ["£50", "£100", "£150", "£200", "£250"], money(50 * (plans.Pro - plans.Enterprise)), "Pro costs £1,000 and Enterprise £900 per month."),
      typed("What does Basic cost per month for 45 users, in £?", 45 * plans.Basic, 0, "£", "45 × £12 = £540."),
      rank("Rank the plans by yearly cost for 50 users paying monthly, highest first.", Object.entries(plans).map(([name, price]) => [name, 50 * price * 12]), "Pro £12,000, Enterprise £10,800, Basic £7,200."),
    ],
  },
  {
    section: "numerical",
    title: "Headcount",
    context: ["HR sent the headcount by department and the share of women in each."],
    table: [["Department", "People", "Women"], ...departments.map(([name, people, share]) => [name, String(people), `${share}%`])],
    items: [
      typed("How many people work in the four departments?", headcount, 0, undefined, "240 + 160 + 300 + 100 = 800."),
      typed("How many women work in Consulting?", 300 * 0.4, 0, undefined, "40% of 300 = 120."),
      typed("What percentage of all staff are women? Give your answer to one decimal place.", (women / headcount) * 100, 1, "%", "108 + 88 + 120 + 50 = 366 women, and 366 / 800 = 45.8%."),
      pick("Tax grows by 25% next year and keeps the same share of women. How many women will work in Tax?", ["88", "100", "105", "110", "120"], String(round(160 * 1.25 * 0.55)), "160 × 1.25 = 200 people, and 55% of 200 = 110."),
    ],
  },
];
