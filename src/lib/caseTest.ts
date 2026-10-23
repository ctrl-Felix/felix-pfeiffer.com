import { numericalSets, round } from "@/data/caseTest/numerical";
import { reasoningSets } from "@/data/caseTest/reasoning";
import type { CaseItem, CaseSet, Section } from "@/data/caseTest/types";
import { shuffle } from "./ccat";

export type CaseQuestion = { set: CaseSet; item: CaseItem; key: string };

export type CaseAnswer = number | number[] | string;

type Random = () => number;

export const setsPerSection = 3;

export const sections: { id: Section; label: string }[] = [
  { id: "numerical", label: "Numerical" },
  { id: "reasoning", label: "Reasoning" },
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

export function buildCaseTest(chosen: Section[], random: Random = Math.random): CaseQuestion[] {
  return chosen.flatMap((section) =>
    shuffle(
      caseSets.filter((set) => set.section === section),
      random,
    )
      .slice(0, setsPerSection)
      .flatMap((set) => set.items.map((item, index) => ({ set, item: shuffleItem(item, random), key: `${set.title}-${index}` }))),
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
    bySection: sections
      .map((section) => {
        const indexes = questions.flatMap((question, index) => (question.set.section === section.id ? [index] : []));
        return {
          ...section,
          total: indexes.length,
          correct: indexes.filter((index) => isCorrect(questions[index].item, answers[index])).length,
          seconds: indexes.reduce((total, index) => total + (seconds[index] ?? 0), 0),
        };
      })
      .filter((section) => section.total > 0),
  };
}
