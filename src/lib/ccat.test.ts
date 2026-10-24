import assert from "node:assert/strict";
import { test } from "node:test";
import { buildTest, buildTopicTest, categoryCounts, formatSeconds, questionPool, scoreTest, testLengths, topicLength, topicOf, topics } from "./ccat";
import { figureKey, isFigure } from "./ccatFigure";

const seeded = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

const optionKey = (option: (typeof questionPool)[number]["options"][number]) => (isFigure(option) ? figureKey(option) : option);

test("every question has distinct options and a valid answer", () => {
  for (const question of questionPool) {
    const label = `${question.kind}: ${question.stem ?? question.prompt} (${question.id})`;
    assert.ok(question.options.length >= 3 && question.options.length <= 5, label);
    assert.ok(Number.isInteger(question.answer) && question.answer >= 0 && question.answer < question.options.length, label);
    assert.equal(new Set(question.options.map(optionKey)).size, question.options.length, label);
    assert.ok(question.explanation.length > 10, label);
    for (const option of question.options) if (isFigure(option)) assert.ok(option.length >= 1 && option.length <= 16, label);
  }
});

test("each category has enough questions for the longest test", () => {
  const longest = categoryCounts(Math.max(...testLengths));
  for (const [category, needed] of Object.entries(longest)) {
    assert.ok(questionPool.filter((question) => question.category === category).length >= needed * 2, category);
  }
});

test("attention to detail answers count the identical pairs", () => {
  for (const question of questionPool.filter((item) => item.pairs)) {
    const same = question.pairs!.filter(([left, right]) => left === right).length;
    assert.equal(question.options[question.answer], String(same));
  }
});

test("a test has the requested length, the CCAT mix and rising difficulty", () => {
  for (const length of testLengths) {
    const questions = buildTest(length, seeded(length));
    assert.equal(questions.length, length);
    assert.equal(new Set(questions.map((question) => question.id)).size, length);
    const counts = categoryCounts(length);
    for (const [category, expected] of Object.entries(counts)) {
      assert.equal(questions.filter((question) => question.category === category).length, expected);
    }
    for (let index = 1; index < questions.length; index++) assert.ok(questions[index].difficulty >= questions[index - 1].difficulty);
  }
  assert.deepEqual(categoryCounts(50), { verbal: 20, math: 18, spatial: 12 });
});

test("shuffled options keep the correct answer", () => {
  const random = seeded(7);
  for (let round = 0; round < 5; round++) {
    for (const question of buildTest(50, random)) {
      const original = questionPool[question.id];
      assert.equal(optionKey(question.options[question.answer]), optionKey(original.options[original.answer]));
    }
  }
});

test("scoring counts correct answers per category and treats skips as wrong", () => {
  const questions = buildTest(20, seeded(3));
  const answers = questions.map((question, index) => (index % 4 === 0 ? null : index % 4 === 1 ? (question.answer + 1) % question.options.length : question.answer));
  const score = scoreTest(questions, answers.slice(0, 18));
  const expected = questions.slice(0, 18).filter((question, index) => answers[index] === question.answer).length;
  assert.equal(score.correct, expected);
  assert.equal(score.answered, answers.slice(0, 18).filter((answer) => answer !== null).length);
  assert.equal(
    score.byCategory.reduce((sum, category) => sum + category.correct, 0),
    expected,
  );
  assert.equal(
    score.byCategory.reduce((sum, category) => sum + category.total, 0),
    20,
  );
});

test("time is shown as minutes and seconds", () => {
  assert.equal(formatSeconds(900), "15:00");
  assert.equal(formatSeconds(65.2), "1:06");
  assert.equal(formatSeconds(-3), "0:00");
});

test("every question belongs to one topic and each topic can be practised on its own", () => {
  for (const question of questionPool) {
    const matches = topics.filter((topic) => topic.kinds.includes(question.kind));
    assert.equal(matches.length, 1, question.kind);
    assert.equal(matches[0].category, question.category, question.kind);
  }
  for (const topic of topics) {
    const available = questionPool.filter((question) => topicOf(question).id === topic.id).length;
    assert.ok(available >= 7, `${topic.id} has ${available}`);
    const questions = buildTopicTest(topic.id, seeded(11));
    assert.equal(questions.length, Math.min(available, topicLength));
    assert.ok(questions.every((question) => topicOf(question).id === topic.id));
  }
});

test("results break the score down by topic", () => {
  const questions = buildTest(30, seeded(2));
  const score = scoreTest(questions, questions.map((question) => question.answer));
  assert.equal(score.byTopic.reduce((sum, topic) => sum + topic.total, 0), 30);
  assert.ok(score.byTopic.every((topic) => topic.correct === topic.total));
});
