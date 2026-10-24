import { mathQuestions } from "@/data/ccat/math";
import { spatialQuestions } from "@/data/ccat/spatial";
import type { Category, Question } from "@/data/ccat/types";
import { verbalQuestions } from "@/data/ccat/verbal";

export type PoolQuestion = Question & { id: number };

export type Answer = number | null;

type Random = () => number;

export const testLengths = [20, 30, 50] as const;

export const secondsPerQuestion = 18;

export const realTest = { questions: 50, minutes: 15, averageScore: 24 };

export const categories: { id: Category; label: string; share: number }[] = [
  { id: "verbal", label: "Verbal", share: 0.4 },
  { id: "math", label: "Math and logic", share: 0.36 },
  { id: "spatial", label: "Spatial reasoning", share: 0.24 },
];

export const topics: { id: string; label: string; category: Category; kinds: string[] }[] = [
  { id: "vocabulary", label: "Vocabulary", category: "verbal", kinds: ["Antonym", "Synonym"] },
  { id: "analogies", label: "Analogies", category: "verbal", kinds: ["Analogy"] },
  { id: "completion", label: "Sentence completion", category: "verbal", kinds: ["Sentence completion"] },
  { id: "detail", label: "Attention to detail", category: "verbal", kinds: ["Attention to detail"] },
  { id: "word", label: "Word problems", category: "math", kinds: ["Word problem"] },
  { id: "series", label: "Number and letter series", category: "math", kinds: ["Number series", "Letter series"] },
  { id: "logic", label: "Logic", category: "math", kinds: ["Logic"] },
  { id: "figures", label: "Figure series", category: "spatial", kinds: ["Next in series"] },
  { id: "odd", label: "Odd one out", category: "spatial", kinds: ["Odd one out"] },
  { id: "matrices", label: "Matrices", category: "spatial", kinds: ["Matrix"] },
];

export const topicOf = (question: Question) => topics.find((topic) => topic.kinds.includes(question.kind))!;

export const topicLength = 15;

export const questionPool: PoolQuestion[] = [...verbalQuestions, ...mathQuestions, ...spatialQuestions].map((question, id) => ({ ...question, id }));

export function shuffle<T>(items: T[], random: Random = Math.random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function categoryCounts(length: number): Record<Category, number> {
  const spatial = Math.round(length * 0.24);
  const math = Math.round(length * 0.36);
  return { verbal: length - spatial - math, math, spatial };
}

function shuffleOptions(question: PoolQuestion, random: Random): PoolQuestion {
  if (question.keepOrder) return question;
  const order = shuffle(question.options.map((_, index) => index), random);
  return { ...question, options: order.map((index) => question.options[index]), answer: order.indexOf(question.answer) };
}

function runsOfKinds(questions: PoolQuestion[], random: Random) {
  const byKind = new Map<string, PoolQuestion[]>();
  for (const question of questions) byKind.set(question.kind, [...(byKind.get(question.kind) ?? []), question]);
  const runs = [...byKind.values()].flatMap((group) => Array.from({ length: Math.ceil(group.length / 3) }, (_, index) => group.slice(index * 3, index * 3 + 3)));
  return shuffle(runs, random).flat();
}

export function buildTest(length: number, random: Random = Math.random) {
  const counts = categoryCounts(length);
  const picked = categories.flatMap((category) =>
    shuffle(
      questionPool.filter((question) => question.category === category.id),
      random,
    ).slice(0, counts[category.id]),
  );
  const ordered = ([1, 2, 3] as const).flatMap((difficulty) => runsOfKinds(shuffle(picked.filter((question) => question.difficulty === difficulty), random), random));
  return ordered.map((question) => shuffleOptions(question, random));
}

export function buildTopicTest(topicId: string, random: Random = Math.random) {
  const picked = shuffle(
    questionPool.filter((question) => topicOf(question).id === topicId),
    random,
  ).slice(0, topicLength);
  return ([1, 2, 3] as const).flatMap((difficulty) => picked.filter((question) => question.difficulty === difficulty)).map((question) => shuffleOptions(question, random));
}

export function scoreTest(questions: PoolQuestion[], answers: Answer[]) {
  const isCorrect = (question: PoolQuestion, index: number) => answers[index] === question.answer;
  return {
    correct: questions.filter(isCorrect).length,
    answered: answers.filter((answer) => answer !== null).length,
    byTopic: topics
      .map((topic) => {
        const indexes = questions.flatMap((question, index) => (topicOf(question).id === topic.id ? [index] : []));
        return { ...topic, total: indexes.length, correct: indexes.filter((index) => isCorrect(questions[index], index)).length };
      })
      .filter((topic) => topic.total > 0),
    byCategory: categories.map((category) => {
      const indexes = questions.flatMap((question, index) => (question.category === category.id ? [index] : []));
      return { ...category, total: indexes.length, correct: indexes.filter((index) => isCorrect(questions[index], index)).length };
    }),
  };
}

export const formatSeconds = (seconds: number) => {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};
