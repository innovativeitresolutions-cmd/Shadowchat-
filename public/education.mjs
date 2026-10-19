// SkySchool study aid: local questions, deterministic scoring and bounded history.
// This is not an accredited exam, student record service or credential.
export const STUDY_QUESTIONS = Object.freeze([
  {
    id: "keys-1", topic: "Wallet security",
    prompt: "Which wallet detail can normally be shared for receiving funds?",
    choices: [
      { id: "a", text: "Recovery seed phrase" },
      { id: "b", text: "Public wallet address" },
      { id: "c", text: "Private signing key" }
    ],
    answer: "b",
    explanation: "Public addresses identify destinations. Seed phrases and private keys must stay secret."
  },
  {
    id: "keys-2", topic: "Wallet security",
    prompt: "A website asks for your seed phrase to repair an account. What is safest?",
    choices: [
      { id: "a", text: "Refuse and verify the service through a trusted channel" },
      { id: "b", text: "Enter the phrase only on a secure-looking page" },
      { id: "c", text: "Send it to the website support chat" }
    ],
    answer: "a",
    explanation: "No support agent or website should ask you to disclose a wallet recovery seed."
  },
  {
    id: "identity-1", topic: "Account security",
    prompt: "Which login choice better protects an account from password theft?",
    choices: [
      { id: "a", text: "Use one password everywhere" },
      { id: "b", text: "Share a one-time passcode with support" },
      { id: "c", text: "Use a unique password and phishing-resistant MFA" }
    ],
    answer: "c",
    explanation: "Unique passwords and phishing-resistant multifactor authentication lower account-takeover risk."
  },
  {
    id: "identity-2", topic: "Account security",
    prompt: "A surprise email links to a login page. What should you do?",
    choices: [
      { id: "a", text: "Open the official site independently and check the request" },
      { id: "b", text: "Sign in because the message looks urgent" },
      { id: "c", text: "Forward your password to confirm the sender" }
    ],
    answer: "a",
    explanation: "Visit the known official address instead of trusting unexpected login links."
  },
  {
    id: "chains-1", topic: "Blockchain basics",
    prompt: "A token was deployed to a public blockchain test network. What does this prove?",
    choices: [
      { id: "a", text: "The token has a verified market price" },
      { id: "b", text: "A test-network contract exists; it does not prove mainnet launch" },
      { id: "c", text: "Regulatory approval and guaranteed liquidity" }
    ],
    answer: "b",
    explanation: "Testnet transactions are not proof of mainnet deployment, market liquidity or compliance."
  },
  {
    id: "chains-2", topic: "Blockchain basics",
    prompt: "Before sending an asset to an address, which detail matters?",
    choices: [
      { id: "a", text: "Only the receiving person's display name" },
      { id: "b", text: "Whether the website has colorful graphics" },
      { id: "c", text: "The asset and its exact supported destination network" }
    ],
    answer: "c",
    explanation: "Asset and network mismatches may make transfers unrecoverable."
  },
  {
    id: "privacy-1", topic: "Privacy",
    prompt: "A community project needs a count of volunteers. Which data is safer to collect?",
    choices: [
      { id: "a", text: "Only the required count, if individuals are unnecessary" },
      { id: "b", text: "Government IDs for everyone, regardless of need" },
      { id: "c", text: "Public lists of personal phone numbers" }
    ],
    answer: "a",
    explanation: "Data minimization reduces privacy and security risk."
  },
  {
    id: "privacy-2", topic: "Privacy",
    prompt: "Does a browser-local study score prove a professional credential?",
    choices: [
      { id: "a", text: "Yes, automatically" },
      { id: "b", text: "No, it is only a personal practice record" },
      { id: "c", text: "Yes, when the score reaches 100%" }
    ],
    answer: "b",
    explanation: "This learning tool does not issue accredited grades, credentials or academic credit."
  }
]);

const TOPICS = [...new Set(STUDY_QUESTIONS.map((question) => question.topic))];

export function scoreStudyCheck(answers = {}, questions = STUDY_QUESTIONS) {
  if (!Array.isArray(questions) || questions.length === 0 || questions.length > 50) {
    throw new RangeError("Questions must be a nonempty bounded set.");
  }
  const submitted = answers && typeof answers === "object" && !Array.isArray(answers)
    ? answers : {};
  const results = questions.map((question) => {
    const choice = Object.hasOwn(submitted, question.id) ? submitted[question.id] : null;
    const selected = typeof choice === "string" &&
      question.choices.some((option) => option.id === choice) ? choice : null;
    return {
      id: question.id,
      topic: question.topic,
      prompt: question.prompt,
      correct: selected === question.answer,
      selected,
      explanation: question.explanation
    };
  });
  const correct = results.filter((entry) => entry.correct).length;
  const missedTopics = [...new Set(results.filter((entry) => !entry.correct)
    .map((entry) => entry.topic))];
  return { correct, total: questions.length,
    percent: Math.round(correct * 100 / questions.length),
    results, missedTopics, completionClaim: false };
}

// Browser storage can be stale or user-modified, so never trust it as a grade.
export function normalizeStudyHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(-20).filter((attempt) =>
    attempt && typeof attempt === "object" &&
    typeof attempt.at === "string" && !Number.isNaN(Date.parse(attempt.at)) &&
    Number.isInteger(attempt.total) && attempt.total === STUDY_QUESTIONS.length &&
    Number.isInteger(attempt.correct) && attempt.correct >= 0 &&
    attempt.correct <= attempt.total &&
    Array.isArray(attempt.missedTopics)
  ).map((attempt) => ({
    at: new Date(attempt.at).toISOString(),
    correct: attempt.correct,
    total: attempt.total,
    percent: Math.round(attempt.correct * 100 / attempt.total),
    missedTopics: [...new Set(attempt.missedTopics.filter((t) =>
      typeof t === "string" && TOPICS.includes(t)))].slice(0, TOPICS.length)
  }));
}

export function recordStudyAttempt(history, result, at = new Date().toISOString()) {
  if (!result || !Number.isInteger(result.correct) ||
      result.total !== STUDY_QUESTIONS.length ||
      result.correct < 0 || result.correct > result.total ||
      !Array.isArray(result.missedTopics)) {
    throw new TypeError("Expected a valid local study result.");
  }
  const stamp = new Date(at);
  if (Number.isNaN(stamp.getTime())) throw new TypeError("Invalid study timestamp.");
  return normalizeStudyHistory([...normalizeStudyHistory(history), {
    at: stamp.toISOString(), correct: result.correct,
    total: result.total, missedTopics: result.missedTopics
  }]);
}

export function studyProgress(history) {
  const attempts = normalizeStudyHistory(history);
  const recent = attempts.at(-1);
  const previous = attempts.at(-2);
  return {
    attempts: attempts.length,
    recentPercent: recent?.percent ?? null,
    bestPercent: attempts.length ? Math.max(...attempts.map((x) => x.percent)) : null,
    changeFromPrevious: recent && previous ? recent.percent - previous.percent : null,
    focusTopics: recent?.missedTopics ?? []
  };
}
