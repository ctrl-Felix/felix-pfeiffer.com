import { numericalSets, round } from "@/data/caseTest/numerical";
import { reasoningSets } from "@/data/caseTest/reasoning";
import type { CaseItem, CaseSet, Section, Topic } from "@/data/caseTest/types";
import { shuffle } from "./ccat";

export type CaseQuestion = { set: CaseSet; item: CaseItem; key: string };

export type CaseAnswer = number | number[] | string;

type Random = () => number;

export const setsPerSection = 3;

export const caseTopics: { id: Topic; label: string; hint: string }[] = [
  { id: "numerical", label: "Numerical reasoning", hint: "Tables and charts: pick, type or rank" },
  { id: "verbal", label: "True, false or cannot say", hint: "What follows from a text" },
  { id: "assumptions", label: "Assumptions", hint: "What an argument takes for granted" },
  { id: "arguments", label: "Strong and weak arguments", hint: "Which reasons matter" },
  { id: "language", label: "Language and communication", hint: "Word choice, tone and ranking" },
];

export const caseSets = [...numericalSets, ...reasoningSets];

export const caseModes: { id: string; label: string; sections: Section[] }[] = [
  { id: "numerical", label: "Numerical", sections: ["numerical"] },
  { id: "reasoning", label: "Reasoning", sections: ["reasoning"] },
  { id: "both", label: "Both parts", sections: ["numerical", "reasoning"] },
];

function shuffleItem(item: CaseItem, random: Random): CaseItem {
  if (item.format !== "pick" || !item.shuffle) return item;
  const order = shuffle(
    item.options.map((_, index) => index),
    random,
  );
  return { ...item, options: order.map((index) => item.options[index]), answer: order.indexOf(item.answer) };
}

const toQuestions = (sets: CaseSet[], random: Random) =>
  sets.flatMap((set) => set.items.map((item, index) => ({ set, item: shuffleItem(item, random), key: `${set.title}-${index}` })));

export function buildCaseTest(chosen: Section[], random: Random = Math.random): CaseQuestion[] {
  return chosen.map((section) =>
    shuffle(
      caseSets.filter((set) => set.section === section),
      random,
    ).slice(0, setsPerSection),
  ).flatMap((sets) => toQuestions(sets, random));
}

export function buildCaseTopic(topic: Topic, random: Random = Math.random): CaseQuestion[] {
  return toQuestions(
    shuffle(
      caseSets.filter((set) => set.topic === topic),
      random,
    ).slice(0, setsPerSection),
    random,
  );
}

export function parseNumber(text: string) {
  const cleaned = text.trim().replace(/[£$€%,\s]/g, "").replace(/k$/i, "");
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

export function isAnswered(item: CaseItem, answer: CaseAnswer | undefined) {
  if (answer === undefined) return false;
  if (item.format === "type") return typeof answer === "string" && parseNumber(answer) !== null;
  if (item.format === "rank") return Array.isArray(answer) && answer.length === item.items.length;
  return typeof answer === "number";
}

export function isCorrect(item: CaseItem, answer: CaseAnswer | undefined) {
  if (!isAnswered(item, answer)) return false;
  if (item.format === "type") {
    const value = parseNumber(answer as string);
    return value !== null && round(value, item.decimals) === item.answer;
  }
  if (item.format === "rank") return (answer as number[]).every((value, index) => value === item.order[index]);
  return answer === item.answer;
}

export function scoreCaseTest(questions: CaseQuestion[], answers: CaseAnswer[], seconds: number[]) {
  const totalSeconds = seconds.reduce((total, value) => total + value, 0);
  return {
    correct: questions.filter((question, index) => isCorrect(question.item, answers[index])).length,
    totalSeconds,
    averageSeconds: questions.length ? totalSeconds / questions.length : 0,
    byTopic: caseTopics
      .map((topic) => {
        const indexes = questions.flatMap((question, index) => (question.set.topic === topic.id ? [index] : []));
        return {
          ...topic,
          total: indexes.length,
          correct: indexes.filter((index) => isCorrect(questions[index].item, answers[index])).length,
          seconds: indexes.reduce((total, index) => total + (seconds[index] ?? 0), 0),
        };
      })
      .filter((topic) => topic.total > 0),
  };
}
