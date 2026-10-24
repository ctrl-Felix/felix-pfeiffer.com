import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCaseTest, buildCaseTopic, caseSets, caseTopics, isCorrect, parseNumber, scoreCaseTest, setsPerSection } from "./caseTest";

const seeded = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

test("every case item has a valid answer", () => {
  for (const set of caseSets) {
    assert.ok(set.items.length >= 3, set.title);
    for (const item of set.items) {
      const label = `${set.title}: ${item.prompt}`;
      assert.ok(item.explanation.length > 5, label);
      if (item.format === "pick") {
        assert.ok(item.options.length <= 5 && item.answer >= 0 && item.answer < item.options.length, label);
        assert.equal(new Set(item.options).size, item.options.length, label);
      }
      if (item.format === "type") assert.ok(Number.isFinite(item.answer), label);
      if (item.format === "rank") assert.deepEqual([...item.order].sort(), item.items.map((_, index) => index), label);
    }
  }
});

test("each section has enough sets for a test", () => {
  for (const section of ["numerical", "reasoning"]) {
    assert.ok(caseSets.filter((set) => set.section === section).length >= setsPerSection * 2, section);
  }
});

test("typed answers accept the rounded value with units and separators", () => {
  const item = { format: "type" as const, prompt: "", answer: 21.1, decimals: 1, explanation: "" };
  assert.equal(isCorrect(item, "21.1"), true);
  assert.equal(isCorrect(item, "21.05%"), true);
  assert.equal(isCorrect(item, "21"), false);
  assert.equal(isCorrect({ ...item, answer: 17275, decimals: 0 }, "£17,275"), true);
  assert.equal(parseNumber("abc"), null);
  assert.equal(parseNumber("2,009k"), 2009);
});

test("numerical answers match the data they are built from", () => {
  const find = (title: string, index: number) => caseSets.find((set) => set.title === title)!.items[index];
  const expect = (title: string, index: number, value: number | string | string[]) => {
    const item = find(title, index);
    if (item.format === "type") assert.equal(item.answer, value, `${title} ${index}`);
    if (item.format === "pick") assert.equal(item.options[item.answer], value, `${title} ${index}`);
    if (item.format === "rank") assert.deepEqual(item.order.map((position) => item.items[position]), value, `${title} ${index}`);
  };
  expect("Regional revenue", 0, 15);
  expect("Regional revenue", 1, ["South", "North", "East", "West", "Scotland"]);
  expect("Regional revenue", 2, "Scotland");
  expect("Regional revenue", 3, 2009);
  expect("Project hours", 1, "24%");
  expect("Project hours", 2, 17275);
  expect("Travel expenses", 2, "Flights");
  expect("Travel expenses", 3, 1480);
  expect("Customer survey", 2, "120");
  expect("Quarterly costs", 1, 21.1);
  expect("Quarterly costs", 2, ["Q4", "Q3", "Q2", "Q1"]);
  expect("Quarterly costs", 3, "£43.75k");
  expect("Website traffic", 1, 2925);
  expect("Website traffic", 2, "Jun");
  expect("Website traffic", 3, 94.3);
  expect("Software pricing", 0, 6120);
  expect("Software pricing", 1, "£100");
  expect("Software pricing", 3, ["Pro", "Enterprise", "Basic"]);
  expect("Headcount", 2, 45.8);
  expect("Headcount", 3, "110");
  expect("Client communication", 1, ["Outstanding, the best I have seen this year.", "Good work, with a few points to tighten.", "It covered the basics.", "It missed the key points and needs redoing."]);
});

test("a test takes whole sets per section and keeps answers after shuffling", () => {
  const questions = buildCaseTest(["numerical", "reasoning"], seeded(5));
  const sets = new Set(questions.map((question) => question.set.title));
  assert.equal(sets.size, setsPerSection * 2);
  assert.equal(questions[0].set.section, "numerical");
  assert.equal(questions.at(-1)!.set.section, "reasoning");
  for (const question of questions) {
    const original = question.set.items.find((item) => item.prompt === question.item.prompt)!;
    if (question.item.format === "pick" && original.format === "pick") assert.equal(question.item.options[question.item.answer], original.options[original.answer]);
  }
});

test("scoring counts each section and the time spent", () => {
  const questions = buildCaseTest(["reasoning"], seeded(9));
  const answers = questions.map((question) => (question.item.format === "pick" ? question.item.answer : question.item.format === "rank" ? question.item.order : String(question.item.answer)));
  answers[0] = -1;
  const score = scoreCaseTest(questions, answers, questions.map(() => 30));
  assert.equal(score.correct, questions.length - 1);
  assert.equal(score.totalSeconds, questions.length * 30);
  assert.equal(score.averageSeconds, 30);
  assert.ok(score.byTopic.every((topic) => topic.id !== "numerical"));
  assert.equal(score.byTopic.reduce((sum, topic) => sum + topic.total, 0), questions.length);
});

test("every case set belongs to a topic that can be practised on its own", () => {
  for (const set of caseSets) assert.ok(caseTopics.some((topic) => topic.id === set.topic), set.title);
  for (const topic of caseTopics) {
    assert.ok(caseSets.filter((set) => set.topic === topic.id).length >= 2, topic.id);
    const questions = buildCaseTopic(topic.id, seeded(4));
    assert.ok(questions.length >= 8, topic.id);
    assert.ok(questions.every((question) => question.set.topic === topic.id), topic.id);
  }
});
