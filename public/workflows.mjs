// Browser-compatible, deterministic planning domain. No API/model/payment connections.
export const PLAN_TEMPLATES = Object.freeze({
  general: Object.freeze([
    "Describe the result you want and how you will recognize success.",
    "Identify the people, tools, and information required.",
    "Choose one realistic next action you can complete.",
    "Record what happened, then revise the next action."
  ]),
  charity: Object.freeze([
    "Describe the community need and who may benefit, without claiming verification.",
    "Identify a charity or volunteer partner and confirm details independently.",
    "Define specific volunteer tasks, owners, and realistic dates.",
    "Track completed work; never treat pledge intent as money received."
  ]),
  learning: Object.freeze([
    "Choose one skill and a clear learning objective.",
    "List three reputable study resources and a practice exercise.",
    "Finish a practice session and record what you missed.",
    "Review the weak topics and retry with fresh questions."
  ]),
  product: Object.freeze([
    "Write one user problem and an observable success criterion.",
    "Build the smallest usable end-to-end feature, not a placeholder screen.",
    "Test errors, accessibility, and real user navigation.",
    "Record what passed, what failed, and the next release decision."
  ])
});

function cleanText(value, max, label) {
  const text = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!text) throw new Error(label + " is required.");
  if (text.length > max) throw new Error(label + " must be " + max + " characters or fewer.");
  return text;
}

export function progressOf(items) {
  const steps = Array.isArray(items) ? items : [];
  const total = steps.length;
  const done = steps.filter((x) => x && x.done === true).length;
  return { done, total, percent: total ? Math.round(done * 100 / total) : 0 };
}

export function createHopePlan(goal, template = "general", id = "plan", createdAt = "") {
  const label = cleanText(goal, 500, "Goal");
  const type = Object.hasOwn(PLAN_TEMPLATES, template) ? template : "general";
  return {
    id: String(id),
    goal: label,
    template: type,
    createdAt: String(createdAt),
    steps: PLAN_TEMPLATES[type].map((title, i) => ({ id: String(i + 1), title, done: false }))
  };
}

export function normalizeHopePlan(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;
  let goal;
  try { goal = cleanText(raw.goal ?? raw.t, 500, "Goal"); } catch { return null; }
  const template = Object.hasOwn(PLAN_TEMPLATES, raw.template) ? raw.template : "general";
  const inputSteps = Array.isArray(raw.steps) ? raw.steps.slice(0, 25) : [];
  const steps = inputSteps.map((step, i) => {
    const title = typeof step === "string" ? step : step?.title;
    return { id: String(typeof step === "object" && step?.id != null ? step.id : i + 1),
      title: String(title ?? "").trim().slice(0, 250), done: typeof step === "object" && step?.done === true };
  }).filter((step) => step.title);
  return {
    id: String(raw.id ?? "legacy-" + index),
    goal, template, createdAt: String(raw.createdAt ?? ""),
    steps: steps.length ? steps : createHopePlan(goal, template).steps
  };
}

export function toggleHopeStep(plan, stepId) {
  const id = String(stepId);
  if (!plan?.steps?.some((s) => String(s.id) === id)) throw new Error("Unknown plan step.");
  return { ...plan, steps: plan.steps.map((s) => String(s.id) === id ? { ...s, done: !s.done } : s) };
}

export function createImpactWorkspace({ title, goal, pledgeIntent = 0 }, id = "campaign", createdAt = "") {
  const cleanTitle = cleanText(title, 120, "Campaign title");
  const cleanGoal = cleanText(goal, 500, "Campaign goal");
  const value = Number(pledgeIntent);
  if (!Number.isFinite(value) || value < 0 || value > 1000000000) throw new Error("Pledge intent must be a non-negative amount.");
  return {
    id: String(id), title: cleanTitle, goal: cleanGoal,
    pledgeIntent: Math.round((value + Number.EPSILON) * 100) / 100,
    moneyMoved: false, charityVerified: false, createdAt: String(createdAt), tasks: []
  };
}

export function normalizeImpactWorkspace(raw, index = 0) {
  if (!raw || typeof raw !== "object") return null;
  let base;
  try {
    base = createImpactWorkspace({
      title: raw.title ?? raw.t, goal: raw.goal ?? raw.g, pledgeIntent: raw.pledgeIntent ?? raw.p ?? 0
    }, raw.id ?? "legacy-" + index, raw.createdAt ?? "");
  } catch { return null; }
  const tasks = Array.isArray(raw.tasks) ? raw.tasks.slice(0, 30) : [];
  base.tasks = tasks.map((t, i) => ({
    id: String(t?.id ?? i + 1), title: String(t?.title ?? "").trim().slice(0, 160),
    done: t?.done === true
  })).filter((t) => t.title);
  return base; // Imported browser data cannot grant charity verification or prove donations.
}

export function addImpactTask(campaign, title, id) {
  if (!campaign || !Array.isArray(campaign.tasks)) throw new Error("Campaign not found.");
  const label = cleanText(title, 160, "Action");
  if (campaign.tasks.length >= 30) throw new Error("Maximum 30 actions per campaign.");
  if (campaign.tasks.some((task) => task.title.toLowerCase() === label.toLowerCase())) throw new Error("This action already exists.");
  return { ...campaign, tasks: [...campaign.tasks, { id: String(id), title: label, done: false }] };
}

export function toggleImpactTask(campaign, taskId) {
  const id = String(taskId);
  if (!campaign?.tasks?.some((task) => String(task.id) === id)) throw new Error("Unknown campaign action.");
  return { ...campaign, tasks: campaign.tasks.map((task) =>
    String(task.id) === id ? { ...task, done: !task.done } : task) };
}

export function removeImpactTask(campaign, taskId) {
  if (!campaign || !Array.isArray(campaign.tasks)) throw new Error("Campaign not found.");
  return { ...campaign, tasks: campaign.tasks.filter((task) => String(task.id) !== String(taskId)) };
}

export function handoffCampaignToHope(campaign, id, createdAt = "") {
  if (!campaign || !campaign.title || !campaign.goal) throw new Error("Campaign is required.");
  const goal = ("Support " + campaign.title + ": " + campaign.goal).slice(0, 500);
  const plan = createHopePlan(goal, "charity", id, createdAt);
  return { ...plan, sourceCampaignId: String(campaign.id) };
}
