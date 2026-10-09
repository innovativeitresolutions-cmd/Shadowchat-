import crypto from "node:crypto";

export const PRODUCT_AREAS = Object.freeze([
  { id: "hopeai", name: "HopeAI", priority: 1, mode: "local-plus-provider", external: true },
  { id: "impact", name: "HopeAI Impact", priority: 2, mode: "planning-only", external: false },
  { id: "social", name: "Social", priority: 3, mode: "browser-local-beta", external: false },
  { id: "marketplace", name: "Marketplace", priority: 4, mode: "lawful-demo-commerce", external: false },
  { id: "games", name: "Games", priority: 5, mode: "demo-credits-only", external: false },
  { id: "education", name: "Education", priority: 6, mode: "study-aid", external: false },
  { id: "crypto", name: "Wallet / Crypto", priority: 7, mode: "watch-only", external: true },
  { id: "security", name: "Security & Privacy", priority: 8, mode: "local-controls", external: false },
  { id: "operations", name: "Release Operations", priority: 9, mode: "evidence-first", external: true }
]);

export const CAPABILITIES = Object.freeze({
  hopeai: {
    localDrafts: true,
    deterministicPlanner: true,
    providerChat: "requires operator-configured endpoint",
    memory: "browser-local only in this baseline",
    identityVerification: false,
  },
  impact: {
    campaignPlanning: true,
    pledgeIntent: true,
    donations: false,
    charityVerification: false,
    settlement: false,
  },
  social: {
    posting: true,
    reactions: true,
    persistence: "browser-local",
    remoteDelivery: false,
    moderationAtScale: false,
  },
  marketplace: {
    listings: true,
    search: true,
    cart: true,
    orderPlanning: true,
    restrictedListingFilter: true,
    payments: false,
    escrow: false,
    sellerVerification: false,
  },
  games: {
    playableDemo: true,
    demoCredits: true,
    realMoney: false,
    regulatedGambling: false,
    cryptographicRng: false,
    redeemableRewards: false,
  },
  education: {
    quizzes: true,
    targetedReview: true,
    certificates: "local completion record only",
    accreditation: false,
  },
  crypto: {
    watchOnlyPortfolio: true,
    networkRegistry: true,
    privateKeyCustody: false,
    transactionBroadcasting: false,
    stakingExecution: false,
    miningExecution: false,
    nftMinting: false,
  },
  operations: {
    healthEndpoint: true,
    capabilityEndpoint: true,
    productionReadiness: false,
    databasePersistence: false,
    backupRestoreEvidence: false,
  }
});

const RESTRICTED_PATTERNS = [
  /\b(fentanyl|heroin|cocaine|meth(?:amphetamine)?|lsd|mdma|ecstasy)\b/i,
  /\b(oxycodone|hydrocodone|xanax|alprazolam|adderall)\b/i,
  /\b(gun|firearm|ammo|ammunition|silencer|suppressor|grenade|explosive)\b/i,
  /\b(stolen\s+(?:account|card|credential|goods?)|carded|cvv|fullz)\b/i,
  /\b(malware|ransomware|spyware|keylogger|botnet|credential\s*stealer)\b/i,
  /\b(fake\s+id|forged\s+(?:passport|license)|counterfeit\s+currency)\b/i,
];

export function moderateListing(input) {
  const title = String(input?.title ?? "").trim();
  const description = String(input?.description ?? "").trim();
  const category = String(input?.category ?? "other").trim().toLowerCase();
  const combined = `${title}\n${description}\n${category}`;
  const matched = RESTRICTED_PATTERNS.find((pattern) => pattern.test(combined));

  if (!title) return { allowed: false, reason: "A listing title is required." };
  if (title.length > 120) return { allowed: false, reason: "Listing title must be 120 characters or fewer." };
  if (description.length > 2000) return { allowed: false, reason: "Description must be 2,000 characters or fewer." };
  if (matched) return { allowed: false, reason: "This listing appears to contain a restricted product or service." };

  return { allowed: true, reason: null };
}

export function normalizeMoney(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function computeSellerTrust({ completedOrders = 0, disputes = 0, rating = 0, accountAgeDays = 0 } = {}) {
  const completed = Math.max(0, Number(completedOrders) || 0);
  const disputeCount = Math.max(0, Number(disputes) || 0);
  const safeRating = Math.min(5, Math.max(0, Number(rating) || 0));
  const age = Math.max(0, Number(accountAgeDays) || 0);

  const orderScore = Math.min(35, Math.log10(completed + 1) * 17.5);
  const ratingScore = (safeRating / 5) * 40;
  const ageScore = Math.min(15, age / 24);
  const disputePenalty = Math.min(45, disputeCount * 7.5);
  const score = Math.max(0, Math.min(100, Math.round(orderScore + ratingScore + ageScore + 10 - disputePenalty)));

  return {
    score,
    label: score >= 85 ? "strong" : score >= 65 ? "established" : score >= 40 ? "developing" : "new/risk-review",
  };
}

const ALLOWED_ORDER_TRANSITIONS = Object.freeze({
  draft: ["submitted", "cancelled"],
  submitted: ["seller_confirmed", "cancelled", "disputed"],
  seller_confirmed: ["fulfilled", "cancelled", "disputed"],
  fulfilled: ["completed", "disputed"],
  disputed: ["resolved", "cancelled"],
  resolved: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
});

export function canTransitionOrder(from, to) {
  return Boolean(ALLOWED_ORDER_TRANSITIONS[from]?.includes(to));
}

export function transitionOrder(order, to) {
  if (!order || typeof order !== "object") throw new TypeError("order is required");
  if (!canTransitionOrder(order.status, to)) {
    throw new Error(`Invalid order transition: ${order.status} -> ${to}`);
  }
  return { ...order, status: to, updatedAt: new Date().toISOString() };
}

export function createOrder({ listingId, quantity = 1, unitPrice = 0, buyerLabel = "local-beta-user" }) {
  const price = normalizeMoney(unitPrice);
  const qty = Math.floor(Number(quantity));
  if (!listingId) throw new Error("listingId is required");
  if (!Number.isInteger(qty) || qty < 1 || qty > 99) throw new Error("quantity must be an integer between 1 and 99");
  if (price === null) throw new Error("unitPrice must be a non-negative number");

  return {
    id: crypto.randomUUID(),
    listingId: String(listingId),
    buyerLabel: String(buyerLabel).slice(0, 80),
    quantity: qty,
    unitPrice: price,
    total: normalizeMoney(price * qty),
    status: "draft",
    settlement: "none",
    financialExecution: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function planImpact({ title, goal, beneficiaries, notes = "" }) {
  const cleanTitle = String(title ?? "").trim();
  const cleanGoal = String(goal ?? "").trim();
  const beneficiaryCount = Math.max(0, Math.floor(Number(beneficiaries) || 0));
  if (!cleanTitle) throw new Error("Impact plan title is required");
  if (!cleanGoal) throw new Error("Impact goal is required");
  return {
    id: crypto.randomUUID(),
    title: cleanTitle.slice(0, 120),
    goal: cleanGoal.slice(0, 500),
    beneficiaries: beneficiaryCount,
    notes: String(notes).trim().slice(0, 1200),
    status: "planning",
    moneyMoved: false,
    charityVerified: false,
    createdAt: new Date().toISOString(),
  };
}

export function buildStudyReview(questions, answers) {
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeAnswers = answers && typeof answers === "object" ? answers : {};
  let correct = 0;
  const missed = [];
  for (const q of safeQuestions) {
    const chosen = safeAnswers[q.id];
    if (chosen === q.answer) correct += 1;
    else missed.push({ id: q.id, topic: q.topic, prompt: q.prompt, expected: q.answer, chosen: chosen ?? null });
  }
  return {
    correct,
    total: safeQuestions.length,
    percent: safeQuestions.length ? Math.round((correct / safeQuestions.length) * 100) : 0,
    missed,
  };
}

export function seededRoll(seed, sides = 100) {
  const safeSides = Math.max(2, Math.floor(Number(sides) || 100));
  const hash = crypto.createHash("sha256").update(String(seed)).digest();
  return (hash.readUInt32BE(0) % safeSides) + 1;
}

export function resolveHighLow({ seed, guess, threshold = 50 }) {
  const roll = seededRoll(seed, 100);
  const normalizedGuess = guess === "high" ? "high" : "low";
  const won = normalizedGuess === "high" ? roll > threshold : roll <= threshold;
  return { roll, won, guess: normalizedGuess, threshold, financialValue: false };
}

export function safeWatchAddress(input) {
  const chain = String(input?.chain ?? "").toLowerCase();
  const address = String(input?.address ?? "").trim();
  if (!chain || !address) return { valid: false, reason: "Chain and address are required." };
  if (chain === "ethereum" || chain === "polygon" || chain === "base" || chain === "bsc") {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
      ? { valid: true, normalized: address }
      : { valid: false, reason: "Expected a 20-byte EVM address." };
  }
  if (chain === "solana") {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
      ? { valid: true, normalized: address }
      : { valid: false, reason: "Expected a base58 Solana public address." };
  }
  return { valid: false, reason: "Unsupported watch-only chain." };
}

export function localHopePlan(prompt) {
  const text = String(prompt ?? "").trim();
  if (!text) return { ok: false, message: "Write a goal or problem first." };
  const compact = text.replace(/\s+/g, " ").slice(0, 500);
  return {
    ok: true,
    mode: "deterministic-local-planner",
    providerUsed: false,
    summary: `Goal: ${compact}`,
    steps: [
      "Define the smallest outcome that would count as progress.",
      "List the information, people, or tools required before acting.",
      "Choose one reversible next action and record the result.",
      "Review what changed and update the plan before the next action.",
    ],
    boundary: "This is a deterministic planning helper, not a connected AI provider response.",
  };
}

export function releaseGateSummary(evidence = {}) {
  const gates = [
    ["invitedSessionPersistence", "Invited-session persistence"],
    ["backupRestoreRpoRto", "Backup/restore with measured RPO/RTO"],
    ["dependencyFailureBaseline", "Dependency-failure baseline"],
    ["crossSystemIntegration", "Launch-critical integration"],
    ["telemetryAlerting", "Deployed telemetry/alerting"],
  ].map(([key, label]) => ({ key, label, passed: evidence[key] === true }));
  return {
    gates,
    passed: gates.filter((g) => g.passed).length,
    total: gates.length,
    productionReady: gates.every((g) => g.passed),
  };
}
