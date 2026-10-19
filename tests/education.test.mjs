import test from "node:test";
import assert from "node:assert/strict";
import {
  STUDY_QUESTIONS, scoreStudyCheck, normalizeStudyHistory,
  recordStudyAttempt, studyProgress
} from "../public/education.mjs";

const allCorrect = Object.fromEntries(STUDY_QUESTIONS.map((q) => [q.id, q.answer]));

test("SkySchool bank provides meaningful bounded topics with distinct answers", () => {
  assert.equal(STUDY_QUESTIONS.length, 8);
  assert.equal(new Set(STUDY_QUESTIONS.map((q) => q.id)).size, 8);
  assert.equal(new Set(STUDY_QUESTIONS.map((q) => q.topic)).size, 4);
  for (const q of STUDY_QUESTIONS) {
    assert.ok(q.prompt.length >= 20);
    assert.ok(q.explanation.length >= 20);
    assert.equal(q.choices.length, 3);
    assert.ok(q.choices.some((choice) => choice.id === q.answer));
  }
});

test("SkySchool scores a complete correct response deterministically", () => {
  const result = scoreStudyCheck(allCorrect);
  assert.equal(result.correct, 8);
  assert.equal(result.total, 8);
  assert.equal(result.percent, 100);
  assert.deepEqual(result.missedTopics, []);
  assert.equal(result.completionClaim, false);
});

test("SkySchool treats unanswered and invalid responses as incorrect, without inventing credit", () => {
  const result = scoreStudyCheck({
    [STUDY_QUESTIONS[0].id]: STUDY_QUESTIONS[0].answer,
    [STUDY_QUESTIONS[1].id]: "nonexistent-choice",
    [STUDY_QUESTIONS[2].id]: ["a"],
  });
  assert.equal(result.correct, 1);
  assert.equal(result.percent, 13);
  assert.equal(result.missedTopics.length, 4);
  assert.equal(result.results[1].selected, null);
  assert.equal(result.results[2].selected, null);
  assert.equal(result.results[0].correct, true);
  assert.equal(result.completionClaim, false);
  assert.throws(() => scoreStudyCheck({}, []), RangeError);
});

test("SkySchool stores bounded local practice attempts and computes progress", () => {
  const first = scoreStudyCheck({});
  const second = scoreStudyCheck(allCorrect);
  let records = recordStudyAttempt([], first, "2026-10-18T10:00:00Z");
  records = recordStudyAttempt(records, second, "2026-10-19T10:00:00Z");
  assert.equal(records.length, 2);
  assert.deepEqual(studyProgress(records), {
    attempts: 2,
    recentPercent: 100,
    bestPercent: 100,
    changeFromPrevious: 100,
    focusTopics: [],
  });
  assert.equal(studyProgress([]).recentPercent, null);
  for (let i = 0; i < 30; i++) records = recordStudyAttempt(records, first);
  assert.equal(records.length, 20);
  assert.equal(studyProgress(records).bestPercent, 0);
});

test("SkySchool ignores corrupted imported records and recalculates percentages", () => {
  const clean = normalizeStudyHistory([
    null,
    { at: "not-a-date", correct: 8, total: 8, missedTopics: [], percent: 100 },
    { at: "2026-10-19T00:00:00Z", correct: 1, total: 8,
      missedTopics: ["Wallet security", "not-our-topic", "Wallet security"],
      percent: 100, accreditation: true },
    { at: "2026-10-19T00:00:00Z", correct: 9, total: 8, missedTopics: [] },
  ]);
  assert.equal(clean.length, 1);
  assert.equal(clean[0].percent, 13);
  assert.deepEqual(clean[0].missedTopics, ["Wallet security"]);
  assert.ok(!Object.hasOwn(clean[0], "accreditation"));
  assert.deepEqual(normalizeStudyHistory({ malicious: true }), []);
});

test("SkySchool rejects malformed result records and timestamps", () => {
  assert.throws(() => recordStudyAttempt([], { correct: 4, total: 999,
    missedTopics: [] }), TypeError);
  assert.throws(() => recordStudyAttempt([], scoreStudyCheck({}), "invalid"), TypeError);
});
