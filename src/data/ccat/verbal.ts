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

const synonym = (word: string, options: string[], difficulty: Difficulty, explanation: string): Question => ({
  category: "verbal",
  kind: "Synonym",
  difficulty,
  prompt: "Choose the word that is closest in meaning to the word in capital letters.",
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
  antonym("EPHEMERAL", ["enduring", "fleeting", "delicate", "ancient", "sudden"], 3, "Ephemeral means lasting a very short time, enduring means lasting long."),
  antonym("AMBIGUOUS", ["unequivocal", "unclear", "double", "flexible", "uncertain"], 3, "Ambiguous means open to more than one meaning, unequivocal means leaving no doubt."),
  antonym("MITIGATE", ["aggravate", "lessen", "delay", "mediate", "measure"], 3, "Mitigate means make less severe, aggravate means make worse."),
  antonym("TACITURN", ["talkative", "silent", "reserved", "sullen", "polite"], 3, "Taciturn means saying little."),
  antonym("SPURIOUS", ["genuine", "false", "rapid", "angry", "partial"], 3, "Spurious means false or fake."),

  analogy("PROLOGUE is to NOVEL as OVERTURE is to", ["opera", "song", "finale", "conductor", "curtain"], 3, "A prologue opens a novel, an overture opens an opera."),
  analogy("ARID is to MOISTURE as ANONYMOUS is to", ["name", "fame", "author", "secret", "face"], 3, "Arid means without moisture, anonymous means without a name."),
  analogy("PRUDENT is to RECKLESS as FRUGAL is to", ["extravagant", "careful", "poor", "generous", "greedy"], 3, "The pairs are opposites."),

  completion("The two proposals are ___: adopting one rules out the other.", ["incompatible", "identical", "similar", "popular", "expensive"], 2, "If one rules out the other, they are incompatible."),
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

  sameCount([["74.209.11.3", "74.209.11.3"], ["0x3FA9C", "0x3FA9C"], ["k9#Lm2!q", "k9#Lm2!q"], ["2026-10-23", "2026-10-23"]], 2),
  sameCount([["Wellington Road", "Welington Road"], ["8 803 112", "8 830 112"], ["DE89 3704", "DE89 3740"], ["Schmidt GmbH", "Schmidt GmbH"]], 2),
  sameCount([["rnodern", "modern"], ["Clifford", "Clifford"], ["0O0O0", "0O0O0"], ["Ill1lI", "Il11lI"]], 3),
  sameCount([["Fraunhofer", "Frauenhofer"], ["1.618034", "1.618043"], ["NW1 2DB", "NW1 2BD"], ["acct_9921", "acct_9912"]], 2),
  sameCount([["Mercer, Dana", "Mercer, Dana"], ["17:45:09", "17:45:09"], ["x-ray 3B", "x-ray 3B"], ["Pinewood Ln.", "Pinewood Ln,"]], 2),
  sameCount([["ZK-48812", "ZK-48812"], ["accommodate", "accomodate"], ["Ste. 400", "Ste. 400"], ["(555) 019-2834", "(555) 019-2834"]], 2),
  sameCount([["Brightwater", "Brightwater"], ["7,040,118", "7,040,118"], ["vN3-pQ8", "vN3-qQ8"], ["Lindenstr. 9a", "Lindenstr. 9a"]], 3),
  antonym("OBSTREPEROUS", ["docile", "noisy", "raucous", "unruly", "boisterous"], 3, "Obstreperous means noisy and hard to control."),
  antonym("EFFRONTERY", ["timidity", "audacity", "boldness", "impudence", "brashness"], 3, "Effrontery means shameless boldness."),
  antonym("PULCHRITUDE", ["ugliness", "grace", "strength", "wisdom", "humility"], 3, "Pulchritude means physical beauty."),
  antonym("RECALCITRANT", ["obedient", "defiant", "stubborn", "rebellious", "insubordinate"], 2, "Recalcitrant means refusing to obey."),
  antonym("ZENITH", ["nadir", "peak", "acme", "summit", "apex"], 2, "The zenith is the highest point, the nadir the lowest."),
  antonym("CACOPHONY", ["euphony", "noise", "disharmony", "din", "clamor"], 3, "Cacophony is a harsh mix of sounds, euphony a pleasing one."),
  antonym("OBSEQUIOUS", ["domineering", "servile", "compliant", "submissive", "fawning"], 3, "Obsequious means too eager to please or obey."),
  antonym("AMELIORATE", ["exacerbate", "improve", "help", "soothe", "mend"], 3, "Ameliorate means make better, exacerbate means make worse."),
  antonym("CASTIGATE", ["praise", "criticize", "punish", "scold", "rebuke"], 2, "Castigate means reprimand severely."),
  antonym("VENERATION", ["contempt", "respect", "adoration", "awe", "reverence"], 2, "Veneration means great respect."),
  antonym("LUGUBRIOUS", ["cheerful", "mournful", "somber", "dismal", "gloomy"], 3, "Lugubrious means looking or sounding sad."),
  antonym("INSIPID", ["flavorful", "bland", "dull", "tasteless", "weak"], 2, "Insipid means lacking flavor or interest."),
  antonym("ABSTAIN", ["indulge", "refrain", "avoid", "decline", "forgo"], 2, "Abstain means hold back from doing something."),
  antonym("OPAQUE", ["transparent", "cloudy", "dense", "heavy", "distant"], 2, "Opaque means not letting light through."),

  synonym("RECONDITE", ["esoteric", "obvious", "shallow", "common", "trivial"], 3, "Recondite means little known and hard to understand."),
  synonym("CALUMNY", ["slander", "praise", "compliment", "eulogy", "accolade"], 3, "Calumny is a false statement made to damage someone."),
  synonym("PERSPICACIOUS", ["shrewd", "transparent", "deceptive", "long-winded", "cautious"], 3, "Perspicacious means quick to notice and understand."),
  synonym("INEXORABLE", ["relentless", "flexible", "yielding", "temporary", "inexplicable"], 3, "Inexorable means impossible to stop."),
  synonym("EQUANIMITY", ["composure", "fairness", "equality", "distance", "agitation"], 3, "Equanimity means calmness under pressure."),
  synonym("DELETERIOUS", ["harmful", "harmless", "healthy", "delicious", "deliberate"], 2, "Deleterious means causing harm."),
  synonym("QUIESCENCE", ["dormancy", "vitality", "turmoil", "curiosity", "activity"], 3, "Quiescence is a state of inactivity."),
  synonym("ABJURE", ["renounce", "assert", "maintain", "validate", "adjure"], 3, "Abjure means formally give up a belief or claim. Adjure means urge."),

  analogy("ASSUME is to PRESUME as ASK is to", ["request", "answer", "tell", "refuse", "know"], 2, "Both pairs are near synonyms."),
  analogy("ABHOR is to ADORE as ABATE is to", ["augment", "decrease", "relinquish", "soften", "subside"], 3, "The pairs are opposites."),
  analogy("REDUNDANT is to SUPERFLUOUS as SCANTY is to", ["sparse", "copious", "excessive", "plentiful", "ample"], 3, "The pairs are synonyms."),
  analogy("MENDACIOUS is to TRUTHFUL as DOCILE is to", ["stubborn", "compliant", "gentle", "quiet", "tame"], 3, "The pairs are opposites."),
  analogy("TACITURN is to RETICENT as VOLUBLE is to", ["garrulous", "silent", "shy", "brief", "terse"], 3, "The pairs are synonyms."),
  analogy("PERIPHERAL is to CORE as MARGINAL is to", ["central", "edge", "boundary", "minor", "partial"], 2, "The pairs are opposites."),
  analogy("DEARTH is to SCARCITY as GLUT is to", ["surplus", "shortage", "lack", "void", "hunger"], 2, "The pairs are synonyms."),
  analogy("ENERVATE is to VIGOR as DEHYDRATE is to", ["water", "heat", "desert", "thirst", "salt"], 3, "To enervate is to drain of vigor, to dehydrate is to drain of water."),
  analogy("ELEGY is to GRIEF as ODE is to", ["praise", "sorrow", "anger", "fear", "rhyme"], 2, "An elegy expresses grief, an ode expresses praise."),
  analogy("BLUEPRINT is to BUILDING as RECIPE is to", ["meal", "kitchen", "ingredient", "chef", "menu"], 2, "Each gives the instructions for making the second."),
  analogy("MELLIFLUOUS is to SOUND as SAVORY is to", ["taste", "sight", "touch", "hearing", "texture"], 2, "Mellifluous describes a pleasant sound, savory a pleasant taste."),
  analogy("SUBTERFUGE is to DECEIT as CANDOR is to", ["honesty", "lies", "secrecy", "trickery", "tact"], 2, "Subterfuge is a form of deceit, candor a form of honesty."),
  analogy("COBBLER is to SHOES as CARTOGRAPHER is to", ["maps", "graphs", "books", "clocks", "photographs"], 2, "A cobbler makes shoes, a cartographer makes maps."),

  completion("The senator's ___ speech was meant to ___ his critics, but it only fueled their resentment.", ["conciliatory … placate", "inflammatory … appease", "laconic … irritate", "verbose … enlighten", "strident … silence"], 3, "But signals the speech failed at a friendly aim."),
  completion("The politician's ___ promises failed to convince the cynical audience.", ["disingenuous", "sincere", "earnest", "candid", "veracious"], 2, "A cynical audience is not convinced by insincere promises."),
  completion("The virus is ___ in this region, making it a ___ health concern.", ["endemic … constant", "absent … major", "rare … slight", "extinct … global", "sporadic … permanent"], 3, "Endemic means always present in an area."),
  completion("His argument was ___, yet it lacked the ___ evidence to convince the jury.", ["compelling … empirical", "flawless … any", "weak … false", "long … visual", "brief … anecdotal"], 3, "Yet contrasts a persuasive argument with missing hard evidence."),
  completion("The ___ student spent every weekend in the library, ___ for her exams.", ["assiduous … preparing", "lazy … sleeping", "distracted … playing", "casual … waiting", "indolent … studying"], 2, "Assiduous means diligent."),
  completion("Her ___ nature often led her to ___ in matters that were none of her business.", ["meddlesome … interfere", "shy … hide", "quiet … listen", "bold … ignore", "reticent … intervene"], 2, "Meddlesome people interfere."),
  completion("Because the data were ___, the researchers could not reach a ___ conclusion.", ["ambiguous … definitive", "clear … final", "plentiful … valid", "sparse … incorrect", "precise … firm"], 2, "Unclear data rule out a definite conclusion."),
  completion("His speech was so ___ that even his opponents were forced to applaud.", ["lucid", "turgid", "tortuous", "incoherent", "abstruse"], 2, "Only a clear speech would win over opponents. The other words mean unclear or overblown."),
];
