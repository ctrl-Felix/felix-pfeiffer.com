import type { CaseItem, CaseSet } from "./types";

const verdicts = ["True", "False", "Cannot say"];
const assumptions = ["Assumption made", "Assumption not made"];
const strengths = ["Strong argument", "Weak argument"];

const tfc = (statement: string, verdict: "True" | "False" | "Cannot say", explanation: string): CaseItem => ({
  format: "pick",
  prompt: `Based only on the text: ${statement}`,
  options: verdicts,
  answer: verdicts.indexOf(verdict),
  explanation,
});

const assumption = (statement: string, made: boolean, explanation: string): CaseItem => ({
  format: "pick",
  prompt: `Proposed assumption: ${statement}`,
  options: assumptions,
  answer: made ? 0 : 1,
  explanation,
});

const argument = (statement: string, strong: boolean, explanation: string): CaseItem => ({
  format: "pick",
  prompt: statement,
  options: strengths,
  answer: strong ? 0 : 1,
  explanation,
});

const pick = (prompt: string, options: string[], explanation: string): CaseItem => ({ format: "pick", prompt, options, answer: 0, shuffle: true, explanation });

const rank = (prompt: string, ordered: string[], shown: number[], explanation: string): CaseItem => ({
  format: "rank",
  prompt,
  items: shown.map((index) => ordered[index]),
  order: ordered.map((statement) => shown.findIndex((index) => ordered[index] === statement)),
  explanation,
});

export const reasoningSets: CaseSet[] = [
  {
    section: "reasoning",
    topic: "verbal",
    title: "Office move",
    context: [
      "Subject: Office move",
      "From Monday 3 March, the London team moves from the 4th to the 7th floor. Desks on the 7th floor are not assigned and are booked through the app. Meeting rooms there hold up to 12 people.",
      "The 4th floor will be closed for refurbishment until June. Anyone who needs a fixed desk for medical reasons should contact HR.",
    ],
    items: [
      tfc("The meeting rooms on the 7th floor hold 12 people at most.", "True", "The email says they hold up to 12 people."),
      tfc("Desks on the 7th floor are assigned to individual staff.", "False", "Desks are not assigned and are booked through the app."),
      tfc("Some staff will keep a fixed desk.", "Cannot say", "Staff can ask HR, but the email does not say whether anyone gets one."),
      tfc("Every UK office is moving floors.", "Cannot say", "The email only covers the London team."),
    ],
  },
  {
    section: "reasoning",
    topic: "verbal",
    title: "Remote work pilot",
    context: [
      "For six months, 80 employees worked from home three days a week. Average output per person rose 6% compared with the six months before. Sick days fell from 4.1 to 2.9 per person.",
      "Twelve participants said they felt less connected to their team. Management will decide in May whether to offer the scheme to all 600 staff.",
    ],
    items: [
      tfc("Output per person was higher during the pilot than before it.", "True", "Average output per person rose 6%."),
      tfc("Working from home caused the fall in sick days.", "Cannot say", "Sick days fell during the pilot, but the text does not show the cause."),
      tfc("Most participants felt less connected to their team.", "False", "Twelve of 80 is a minority."),
      pick(
        "Which conclusion is best supported by the text?",
        ["Participants took fewer sick days during the pilot than before it.", "All staff will work from home from May.", "Output rose because sick days fell.", "The pilot reduced the firm's costs."],
        "Only the fall in sick days is stated directly. The others go beyond the text.",
      ),
    ],
  },
  {
    section: "reasoning",
    topic: "arguments",
    title: "Second review",
    context: ["The firm is discussing whether every client report should be reviewed by a second person before it is sent. Decide whether each argument is strong or weak. A strong argument is important and directly related to the question."],
    items: [
      argument("Yes. A second reviewer catches errors the author no longer sees, which protects the firm's reputation.", true, "It is relevant, important and directly tied to the question."),
      argument("No. Some people dislike having their work checked.", false, "Personal preference does not weigh against report quality."),
      argument("Yes. Other firms might already do it.", false, "What other firms might do is speculative and not a reason in itself."),
      argument("No. For urgent reports the extra step would sometimes miss client deadlines.", true, "It names a real, relevant cost of the policy."),
    ],
  },
  {
    section: "reasoning",
    topic: "arguments",
    title: "Four-day week",
    context: ["The firm is discussing whether staff should work four days a week for the same pay. Decide whether each argument is strong or weak. A strong argument is important and directly related to the question."],
    items: [
      argument("Yes. A shorter week would help the firm attract applicants while hiring is hard.", true, "It is important and directly tied to the decision."),
      argument("No. Some managers have never worked a four-day week.", false, "Whether managers have done it before does not bear on whether it would work."),
      argument("Yes. Everyone likes having more free time.", false, "It is a sweeping claim and says nothing about the firm."),
      argument("No. Client-facing teams would be harder to reach on one weekday, which could hurt service.", true, "It names a real, relevant cost of the change."),
    ],
  },
  {
    section: "reasoning",
    topic: "assumptions",
    title: "Launch in Germany",
    context: [
      "A product manager writes: \"We should launch the app in Germany next quarter, because German users already make up a fifth of our downloads.\"",
      "An assumption is something taken for granted without being said. For each proposed assumption, decide whether the writer takes it for granted. Judge each one on its own and use only the statement. Test: if the assumption were false, would the statement stop making sense?",
    ],
    items: [
      assumption("Download numbers are a fair sign of demand.", true, "If downloads said nothing about demand, a fifth of downloads would be no reason to launch. The statement relies on it."),
      assumption("German users would welcome a version made for their market.", true, "If German users did not want it, launching there would make no sense. The statement relies on it."),
      assumption("The app has no competitors in Germany.", false, "The statement makes sense whether or not there are competitors. Nothing in it depends on this."),
      assumption("The app is already available in German.", false, "The statement does not mention language and still makes sense if the app is not in German."),
    ],
  },
  {
    section: "reasoning",
    topic: "assumptions",
    title: "Meeting costs",
    context: [
      "A team lead writes: \"We have to cut travel costs this quarter, so we should hold the client review online.\"",
      "An assumption is something taken for granted without being said. For each proposed assumption, decide whether the writer takes it for granted. Judge each one on its own and use only the statement. Test: if the assumption were false, would the statement stop making sense?",
    ],
    items: [
      assumption("An online review costs less than meeting in person.", true, "If an online review cost as much or more, it would not help cut costs. The statement relies on it."),
      assumption("Everyone who needs to attend can join online.", true, "If key people could not join, holding the review online would not work. The statement relies on it."),
      assumption("Online reviews are more productive than meetings in person.", false, "The statement is only about cost. It still makes sense if online reviews are less productive."),
      assumption("The client prefers online meetings.", false, "The client's preference is not part of the reasoning. The statement still makes sense without it."),
    ],
  },

  {
    section: "reasoning",
    topic: "verbal",
    title: "Data policy",
    context: [
      "Firm policy: all client data must be stored on servers in the UK or the EU.",
      "The firm's analytics tool stores data only in the US. The marketing team wants to use the tool for a client campaign.",
    ],
    items: [
      tfc("The analytics tool may be used with client data as it is.", "False", "It stores data only in the US, which the policy does not allow."),
      tfc("Storing client data in the EU is allowed.", "True", "The policy allows the UK or the EU."),
      tfc("The firm's own servers are in the UK.", "Cannot say", "The text does not say where the firm's servers are."),
      pick(
        "Which conclusion follows from the text?",
        ["The team cannot use the tool with client data unless it stores data in the UK or EU.", "The team must find another client.", "The firm will move its servers to the US.", "The analytics tool is insecure."],
        "Only this follows from the policy and the tool's storage location.",
      ),
    ],
  },
  {
    section: "reasoning",
    topic: "language",
    title: "Email draft",
    context: ["A colleague asks you to finish an email to a client. Choose the word that fits each gap."],
    items: [
      pick("Please find ___ the agenda for Thursday's meeting.", ["attached", "attaching", "attach", "attachment"], "\"Please find attached\" is the standard phrase."),
      pick("The deadline has moved ___ Friday to Wednesday.", ["from", "since", "by", "at"], "Something moves from one date to another."),
      pick("We need to ___ the risks before we sign the contract.", ["assess", "access", "excess", "asses"], "Assess means evaluate. Access means reach or enter."),
      pick("The ___ reason for the delay was a supplier issue.", ["principal", "principle", "principled", "principally"], "Principal means main. A principle is a rule or belief."),
    ],
  },
  {
    section: "reasoning",
    topic: "language",
    title: "Client communication",
    context: ["You are preparing notes and replies for a client team."],
    items: [
      pick(
        "A senior client asks for an update on your analysis. Which reply fits best?",
        [
          "Dear Ms Patel, the analysis is on track and I will send you the draft by Thursday. Kind regards, Sam",
          "Hi! All fine here, will send stuff soon :)",
          "Ms Patel, I am busy and will reply when the analysis is done.",
          "Dear Ms Patel, there have been some things happening and it might be late or maybe not.",
        ],
        "It is polite, clear and gives a specific date.",
      ),
      rank(
        "Rank this feedback on a presentation from most positive to most negative.",
        ["Outstanding, the best I have seen this year.", "Good work, with a few points to tighten.", "It covered the basics.", "It missed the key points and needs redoing."],
        [2, 0, 3, 1],
        "From outstanding to good to basic to needing a redo.",
      ),
      rank(
        "Rank these statements from most certain to least certain.",
        ["The figures are final.", "The figures are very likely correct.", "The figures may be correct.", "The figures are unlikely to be correct."],
        [1, 3, 0, 2],
        "Final, then very likely, then may be, then unlikely.",
      ),
      rank(
        "Rank these requests from most urgent to least urgent.",
        ["Needed within the hour.", "Needed by the end of today.", "Needed by Friday.", "Needed when you have time."],
        [3, 1, 0, 2],
        "Within the hour, then today, then Friday, then whenever.",
      ),
    ],
  },
  {
    section: "reasoning",
    topic: "verbal",
    title: "Quarterly sales",
    context: [
      "The firm's three products sold 14,000 units in total last quarter. Product A sold twice as many units as Product B. Product C sold 2,000 units, its lowest total in two years.",
      "A price rise for Product B took effect halfway through the quarter.",
    ],
    items: [
      tfc("Product A sold 8,000 units.", "True", "A and B sold 12,000 together and A sold twice as many as B, so A sold 8,000 and B 4,000."),
      tfc("The price rise reduced sales of Product B.", "Cannot say", "The text gives no sales figures before and after the rise."),
      tfc("Product C sold more units than Product B.", "False", "C sold 2,000 and B sold 4,000."),
      tfc("The price of Product B rose at the start of the quarter.", "False", "It rose halfway through the quarter."),
    ],
  },
];
