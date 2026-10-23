import type { Difficulty, Question } from "./types";

const antonym = (word: string, options: string[], difficulty: Difficulty, explanation: string): Question => ({
  category: "verbal",
  kind: "Antonym",
  difficulty,
  prompt: "Choose the word that is most nearly opposite to the word in capital letters.",
  stem: word,
  options,
  answer: 0,
  explanation,
});

const analogy = (stem: string, options: string[], difficulty: Difficulty, explanation: string): Question => ({
  category: "verbal",
  kind: "Analogy",
  difficulty,
  prompt: "Complete the analogy.",
  stem,
  options,
  answer: 0,
  explanation,
});

const completion = (stem: string, options: string[], difficulty: Difficulty, explanation: string): Question => ({
  category: "verbal",
  kind: "Sentence completion",
  difficulty,
  prompt: "Choose the answer that best completes the sentence.",
  stem,
  options,
  answer: 0,
  explanation,
});

const sameCount = (pairs: [string, string][], difficulty: Difficulty): Question => {
  const same = pairs.filter(([left, right]) => left === right).length;
  const differing = pairs.flatMap(([left, right], index) => (left === right ? [] : [`pair ${index + 1}`]));
  return {
    category: "verbal",
    kind: "Attention to detail",
    difficulty,
    prompt: "How many of the following pairs are exactly the same?",
    pairs,
    options: ["0", "1", "2", "3", "4"],
    answer: same,
    keepOrder: true,
    explanation: differing.length ? `${same} pairs match. Differences are in ${differing.join(", ")}.` : "All four pairs match exactly.",
  };
};

export const verbalQuestions: Question[] = [
  antonym("SCARCE", ["abundant", "rare", "costly", "hidden", "small"], 1, "Scarce means in short supply, abundant means plentiful."),
  antonym("FRUGAL", ["wasteful", "thrifty", "careful", "poor", "modest"], 1, "Frugal means sparing with money, wasteful is the opposite."),
  antonym("AMPLIFY", ["diminish", "increase", "explain", "repeat", "clarify"], 1, "Amplify means make larger or louder, diminish means make smaller."),
  antonym("BENEVOLENT", ["malicious", "kind", "generous", "wealthy", "tired"], 1, "Benevolent means well-meaning, malicious means intending harm."),
  antonym("HAUGHTY", ["humble", "arrogant", "tall", "angry", "cautious"], 1, "Haughty means arrogantly superior, humble is the opposite."),
  antonym("LETHARGIC", ["energetic", "sluggish", "sleepy", "calm", "careless"], 1, "Lethargic means lacking energy."),
  antonym("CANDID", ["evasive", "frank", "brief", "gentle", "loud"], 2, "Candid means open and honest, evasive means avoiding a direct answer."),
  antonym("OBSCURE", ["evident", "vague", "distant", "minor", "ancient"], 2, "Obscure means unclear or hidden, evident means plain to see."),
  antonym("VERBOSE", ["concise", "wordy", "rude", "quiet", "clever"], 2, "Verbose means using too many words, concise means brief and to the point."),
  antonym("TRANSIENT", ["permanent", "brief", "moving", "foreign", "sudden"], 2, "Transient means lasting only a short time."),
  antonym("PROLIFIC", ["unproductive", "famous", "fertile", "talented", "creative"], 2, "Prolific means producing a lot."),
  antonym("ADVERSE", ["favorable", "harmful", "opposite", "careful", "active"], 2, "Adverse means harmful or unfavorable."),
  antonym("ZEALOUS", ["apathetic", "eager", "jealous", "faithful", "strict"], 2, "Zealous means full of enthusiasm, apathetic means showing no interest."),
  antonym("EPHEMERAL", ["enduring", "fleeting", "delicate", "ancient", "sudden"], 3, "Ephemeral means lasting a very short time, enduring means lasting long."),
  antonym("AMBIGUOUS", ["unequivocal", "unclear", "double", "flexible", "uncertain"], 3, "Ambiguous means open to more than one meaning, unequivocal means leaving no doubt."),
  antonym("MITIGATE", ["aggravate", "lessen", "delay", "mediate", "measure"], 3, "Mitigate means make less severe, aggravate means make worse."),
  antonym("TACITURN", ["talkative", "silent", "reserved", "sullen", "polite"], 3, "Taciturn means saying little."),
  antonym("SPURIOUS", ["genuine", "false", "rapid", "angry", "partial"], 3, "Spurious means false or fake."),

  analogy("GLOVE is to HAND as SOCK is to", ["foot", "shoe", "knit", "warm", "leg"], 1, "A glove covers a hand, a sock covers a foot."),
  analogy("AUTHOR is to NOVEL as COMPOSER is to", ["symphony", "piano", "orchestra", "conductor", "audience"], 1, "An author creates a novel, a composer creates a symphony."),
  analogy("HOT is to COLD as ANCIENT is to", ["modern", "old", "history", "warm", "ruin"], 1, "The pairs are opposites."),
  analogy("PETAL is to FLOWER as PAGE is to", ["book", "paper", "word", "read", "ink"], 1, "A petal is part of a flower, a page is part of a book."),
  analogy("PILOT is to AIRPLANE as CAPTAIN is to", ["ship", "crew", "uniform", "harbor", "sea"], 1, "A pilot commands an airplane, a captain commands a ship."),
  analogy("CATERPILLAR is to BUTTERFLY as TADPOLE is to", ["frog", "fish", "pond", "egg", "insect"], 1, "A caterpillar grows into a butterfly, a tadpole grows into a frog."),
  analogy("MILE is to DISTANCE as HOUR is to", ["time", "clock", "speed", "minute", "day"], 1, "A mile is a unit of distance, an hour is a unit of time."),
  analogy("SCULPTOR is to CHISEL as SURGEON is to", ["scalpel", "hospital", "patient", "doctor", "operation"], 1, "The chisel is the sculptor's tool, the scalpel is the surgeon's tool."),
  analogy("HAMMER is to NAIL as SCREWDRIVER is to", ["screw", "bolt", "wood", "tool", "drill"], 1, "A hammer drives a nail, a screwdriver drives a screw."),
  analogy("THERMOMETER is to TEMPERATURE as BAROMETER is to", ["pressure", "weather", "altitude", "rain", "wind"], 2, "A barometer measures air pressure."),
  analogy("DROUGHT is to RAIN as FAMINE is to", ["food", "hunger", "crop", "water", "desert"], 2, "A drought is a lack of rain, a famine is a lack of food."),
  analogy("FRAGILE is to BREAK as FLAMMABLE is to", ["burn", "melt", "bend", "freeze", "float"], 2, "Something fragile breaks easily, something flammable burns easily."),
  analogy("CUB is to BEAR as KID is to", ["goat", "child", "sheep", "deer", "horse"], 2, "A cub is a young bear, a kid is a young goat."),
  analogy("IGNITE is to EXTINGUISH as ASSEMBLE is to", ["dismantle", "build", "gather", "repair", "arrange"], 2, "The pairs are opposite actions."),
  analogy("LIBRARY is to BOOKS as ARCHIVE is to", ["records", "building", "history", "librarian", "dust"], 2, "A library stores books, an archive stores records."),
  analogy("PROLOGUE is to NOVEL as OVERTURE is to", ["opera", "song", "finale", "conductor", "curtain"], 3, "A prologue opens a novel, an overture opens an opera."),
  analogy("ARID is to MOISTURE as ANONYMOUS is to", ["name", "fame", "author", "secret", "face"], 3, "Arid means without moisture, anonymous means without a name."),
  analogy("PRUDENT is to RECKLESS as FRUGAL is to", ["extravagant", "careful", "poor", "generous", "greedy"], 3, "The pairs are opposites."),

  completion("Although the manager was usually ___, she lost her temper during the meeting.", ["calm", "angry", "late", "absent", "loud"], 1, "Although signals a contrast with losing her temper."),
  completion("Because the instructions were so ___, nobody knew what to do.", ["ambiguous", "detailed", "precise", "helpful", "accurate"], 1, "Only unclear instructions explain the confusion."),
  completion("The new policy was meant to ___ costs, but expenses rose instead.", ["reduce", "increase", "double", "report", "ignore"], 1, "But signals the opposite of what happened."),
  completion("His ___ remarks offended several guests at the dinner.", ["tactless", "polite", "quiet", "witty", "brief"], 1, "Remarks that offend are tactless."),
  completion("The museum's collection is so ___ that it takes days to see everything.", ["extensive", "modest", "valuable", "famous", "recent"], 1, "Taking days to see it all means the collection is large."),
  completion("The witness's account was ___: every detail matched the video footage.", ["accurate", "false", "dramatic", "brief", "confused"], 1, "Matching the footage means it was accurate."),
  completion("The hikers were ___ by the storm and had to wait two days for rescue.", ["stranded", "rescued", "guided", "warned", "cheered"], 1, "Waiting for rescue means they were stranded."),
  completion("The scientist's theory was ___ by new evidence, so she had to abandon it.", ["refuted", "confirmed", "published", "ignored", "praised"], 2, "She abandoned it because the evidence disproved it."),
  completion("Despite years of practice, her skills remained ___, showing little improvement.", ["stagnant", "impressive", "versatile", "rapid", "unique"], 2, "Little improvement means her skills stayed the same."),
  completion("The CEO's speech was deliberately ___, leaving analysts unsure of the company's plans.", ["vague", "clear", "short", "loud", "honest"], 2, "Leaving people unsure points to a vague speech."),
  completion("Fees were ___ for students, who paid nothing at all.", ["waived", "raised", "doubled", "charged", "delayed"], 2, "Paying nothing means the fees were waived."),
  completion("The two proposals are ___: adopting one rules out the other.", ["incompatible", "identical", "similar", "popular", "expensive"], 2, "If one rules out the other, they are incompatible."),
  completion("Her argument was so ___ that even her critics conceded the point.", ["compelling", "weak", "lengthy", "emotional", "controversial"], 2, "Critics only concede to a convincing argument."),
  completion("Once considered ___, the technology is now used in almost every home.", ["exotic", "common", "cheap", "essential", "outdated"], 2, "Once signals a contrast with being in every home now."),
  completion(
    "The report was ___ rather than ___: it described events without judging them.",
    ["descriptive … evaluative", "critical … neutral", "short … long", "accurate … false", "formal … casual"],
    3,
    "Describing without judging is descriptive, not evaluative.",
  ),
  completion(
    "The negotiator was ___ in public but ___ in private, where she gave up almost nothing.",
    ["conciliatory … intransigent", "hostile … stubborn", "silent … talkative", "generous … flexible", "nervous … calm"],
    3,
    "Friendly in public but unyielding in private, where she conceded nothing.",
  ),

  sameCount([["Hartmann & Co.", "Hartmann & Co."], ["4821-0937", "4821-0973"], ["Main St. 14", "Main St. 14"], ["J. P. Morgan", "J. P. Morgen"]], 1),
  sameCount([["74.209.11.3", "74.209.11.3"], ["0x3FA9C", "0x3FA9C"], ["k9#Lm2!q", "k9#Lm2!q"], ["2026-10-23", "2026-10-23"]], 2),
  sameCount([["Wellington Road", "Welington Road"], ["8 803 112", "8 830 112"], ["DE89 3704", "DE89 3740"], ["Schmidt GmbH", "Schmidt GmbH"]], 2),
  sameCount([["rnodern", "modern"], ["Clifford", "Clifford"], ["0O0O0", "0O0O0"], ["Ill1lI", "Il11lI"]], 3),
  sameCount([["$12,450.00", "$12,405.00"], ["Order #55102", "Order #55102"], ["Q3 2025", "Q3 2025"], ["ref: AB-77", "ref: AB-77"]], 1),
  sameCount([["Fraunhofer", "Frauenhofer"], ["1.618034", "1.618043"], ["NW1 2DB", "NW1 2BD"], ["acct_9921", "acct_9912"]], 2),
  sameCount([["Mercer, Dana", "Mercer, Dana"], ["17:45:09", "17:45:09"], ["x-ray 3B", "x-ray 3B"], ["Pinewood Ln.", "Pinewood Ln,"]], 2),
  sameCount([["ZK-48812", "ZK-48812"], ["accommodate", "accomodate"], ["Ste. 400", "Ste. 400"], ["(555) 019-2834", "(555) 019-2834"]], 2),
  sameCount([["Brightwater", "Brightwater"], ["7,040,118", "7,040,118"], ["vN3-pQ8", "vN3-qQ8"], ["Lindenstr. 9a", "Lindenstr. 9a"]], 3),
];
