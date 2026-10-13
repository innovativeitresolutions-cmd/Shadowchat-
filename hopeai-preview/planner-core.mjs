/**
 * Deterministic, entirely in-browser HopeAI tools. These are NOT generative AI.
 * No external requests, accounts, payments, or permanent storage.
 */
const STEPS = Object.freeze({
  learning: [
    (goal) => `Define what success looks like for learning ${goal} in one sentence.`,
    () => "Write down what you already know and choose one small question to answer.",
    () => "Read reliable introductory material and collect two useful examples.",
    () => "Practice one tiny exercise. Keep the first attempt even if imperfect.",
    () => "Check your work against trusted references or a knowledgeable person.",
    () => "Note what worked, what remains unclear, and the next practice session."
  ],
  volunteer: [
    (goal) => `Clarify the community need behind ${goal}; ask affected people what would help.`,
    () => "Identify a local registered organization or community group; independently verify its contact details.",
    () => "Ask about volunteer orientation, age and safety rules, accessibility, and requested supplies.",
    () => "Set a realistic amount of time and a clear boundary for your involvement.",
    () => "Coordinate with an authorized organizer before collecting goods or handling personal data.",
    () => "Afterward, record what you personally did and seek consent before publicly sharing stories or photos."
  ],
  build: [
    (goal) => `Write a problem statement and a measurable outcome for ${goal}.`,
    () => "List current users, permissions, data boundaries, and security assumptions.",
    () => "Build a thin end-to-end implementation that creates observable value.",
    () => "Add input validation, error handling, tests, and keyboard-accessible interactions.",
    () => "Run a realistic deployment checklist: lint, build, unit tests, runtime health, secret scanning.",
    () => "Document unsupported capabilities; release only after checking exact deployed revision and rollback."
  ]
});
const TITLES = Object.freeze({learning:"Learning pathway",volunteer:"Community action plan",build:"Engineering release plan"});
const NOTICES = Object.freeze({
  learning:"Learning resource suggestions must be independently checked. No certificates are awarded.",
  volunteer:"This is planning guidance only: no charity verification, funding, donations, or volunteer placement happens.",
  build:"This is a planning checklist only: it does not deploy software, certify security, or operate accounts."
});
export function makePlan(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new TypeError("Invalid plan");
  const {type, goal, minutes} = raw;
  if (!Object.hasOwn(STEPS, type)) throw new RangeError("Choose a supported workflow");
  if (typeof goal !== "string" || !goal.trim() || goal.length > 120 ||
      /[\u0000-\u001f\u007f]/.test(goal)) throw new RangeError("Goal must be 1–120 characters");
  const duration = Number(minutes);
  if (![15,30,60].includes(duration)) throw new RangeError("Choose 15, 30, or 60 minutes");
  const cleanedGoal = goal.trim().replace(/\s+/g, " ");
  const steps = STEPS[type].map(f => f(cleanedGoal));
  const title = TITLES[type];
  const notice = NOTICES[type];
  const allocations = [1,2,3,4,5,6].map(weight => Math.max(1, Math.round(duration * weight / 21)));
  const markdown = [
    "# " + title, "",
    "**Goal:** " + cleanedGoal, "**Time available:** " + duration + " minutes", "",
    "This is a deterministic browser-only template, not an AI response.", "",
    ...steps.map((step, idx) => `${idx+1}. **Step ${idx+1} (~${allocations[idx]} min)** — ${step}`),
    "", "**Limits:** " + notice, "", "No data was sent to HopeAI servers to make this plan."
  ].join("\n");
  return {title, goal:cleanedGoal, minutes:duration, steps, notice, markdown};
}
