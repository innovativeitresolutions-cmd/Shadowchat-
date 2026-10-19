# SkySchool local study assessment and review

**Status: engineering beta, browser-local practice only.**

SkySchool now provides an eight-question security, wallet, blockchain and privacy
practice assessment, not just a single radio-choice example. The app reports
question-level feedback, four-topic study gaps and a local progress summary.

## User journey

1. Open **Education** from desktop or mobile navigation.
2. Answer up to eight multiple-choice practice questions and select **Score practice check**.
   Unanswered questions count as incorrect and no result is manufactured.
3. Review explanations for all questions and the topics that were missed.
4. Optionally choose **Create HopeAI plan for weak topics**. That makes a local,
   deterministic HopeAI *learning* action plan with the missed topic names.
5. Repeat the assessment to compare the latest, best and prior scores.

Up to 20 result summaries persist in this browser's `localStorage`. Review
histories are bounded, malformed history entries are ignored and calculated
percentages are rebuilt from valid correct/total counts rather than trusting
imported percentage fields. Feedback text itself is not persisted as a remote record.

## Domain/API contract

- `public/education.mjs` exports `STUDY_QUESTIONS`, `scoreStudyCheck`,
  `normalizeStudyHistory`, `recordStudyAttempt` and `studyProgress`.
- `scoreStudyCheck(answers)` accepts a map of question IDs to option IDs.
  Unknown/invalid option IDs are considered unanswered, not accepted.
- The result has `correct`, `total`, `percent`, `results`,
  `missedTopics` and `completionClaim: false`.
- `recordStudyAttempt` only records bounded practice-result summaries;
  `studyProgress` computes best/latest scores and the change since the
  previous valid attempt. No fake remote learning statistics are displayed.

## Security, privacy and limitations

- Study history is editable browser data and **not** a verified learning record,
  academic credit, recognized certificate, formal evaluation or accreditation.
- There is no account, teacher portal, grading server, durable database,
  inter-device sync, backup, analytics service or educational personalization.
- No password, seed phrase, private key, government ID or beneficiary record is
  needed for the quiz. Never type secrets into local planning fields.
- HopeAI handoff uses a deterministic local plan, **not a connected AI model**.
- A browser refresh keeps stored summary attempts, but not the previous
  question-by-question feedback; clearing browser data deletes the summaries.

## Verification

`npm run check && npm test && npm run verify` runs syntax, pure grading and
history tests, HTTP asset delivery, and the existing release gates. This feature
does not override the unresolved production/deployment gates.
