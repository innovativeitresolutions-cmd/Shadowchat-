import test from "node:test";
import assert from "node:assert/strict";
import {
  CAPABILITIES,
  moderateListing,
  computeSellerTrust,
  createOrder,
  canTransitionOrder,
  transitionOrder,
  planImpact,
  buildStudyReview,
  seededRoll,
  resolveHighLow,
  safeWatchAddress,
  localHopePlan,
  releaseGateSummary,
} from "../src/domain.mjs";

test("restricted marketplace items fail closed", () => {
  assert.equal(moderateListing({ title: "fentanyl listing", description: "x" }).allowed, false);
  assert.equal(moderateListing({ title: "malware service", description: "x" }).allowed, false);
  assert.equal(moderateListing({ title: "Creator template", description: "original digital design" }).allowed, true);
});

test("seller trust is deterministic and penalizes disputes", () => {
  const strong = computeSellerTrust({ completedOrders: 500, disputes: 0, rating: 4.9, accountAgeDays: 900 });
  const risky = computeSellerTrust({ completedOrders: 5, disputes: 6, rating: 2, accountAgeDays: 10 });
  assert.ok(strong.score > risky.score);
  assert.ok(strong.score <= 100 && risky.score >= 0);
});

test("order drafts never imply financial execution", () => {
  const order = createOrder({ listingId: "a", quantity: 2, unitPrice: 9.99 });
  assert.equal(order.total, 19.98);
  assert.equal(order.financialExecution, false);
  assert.equal(order.settlement, "none");
  assert.equal(canTransitionOrder("draft", "submitted"), true);
  assert.equal(canTransitionOrder("draft", "completed"), false);
  assert.equal(transitionOrder(order, "submitted").status, "submitted");
});

test("impact plans remain planning-only", () => {
  const plan = planImpact({ title: "Food pantry support", goal: "Plan volunteer coverage", beneficiaries: 25 });
  assert.equal(plan.moneyMoved, false);
  assert.equal(plan.charityVerified, false);
  assert.equal(plan.status, "planning");
});

test("education review identifies missed topics", () => {
  const questions = [{ id: "1", topic: "security", prompt: "p", answer: "a" }, { id: "2", topic: "wallet", prompt: "p2", answer: "b" }];
  const result = buildStudyReview(questions, { 1: "a", 2: "x" });
  assert.equal(result.correct, 1);
  assert.equal(result.percent, 50);
  assert.equal(result.missed[0].topic, "wallet");
});

test("game resolution is deterministic and non-financial", () => {
  assert.equal(seededRoll("same-seed"), seededRoll("same-seed"));
  const result = resolveHighLow({ seed: "round-1", guess: "high" });
  assert.equal(result.financialValue, false);
  assert.ok(result.roll >= 1 && result.roll <= 100);
});

test("watch-only address validation never handles keys", () => {
  assert.equal(safeWatchAddress({ chain: "ethereum", address: "0x1111111111111111111111111111111111111111" }).valid, true);
  assert.equal(safeWatchAddress({ chain: "ethereum", address: "seed phrase words" }).valid, false);
});

test("HopeAI local mode identifies itself as deterministic", () => {
  const plan = localHopePlan("Improve onboarding");
  assert.equal(plan.ok, true);
  assert.equal(plan.providerUsed, false);
  assert.match(plan.boundary, /not a connected AI provider/i);
});

test("major release gates default to not production ready", () => {
  const summary = releaseGateSummary({});
  assert.equal(summary.productionReady, false);
  assert.equal(summary.passed, 0);
  assert.equal(summary.total, 5);
});

test("capability matrix refuses unsupported external claims", () => {
  assert.equal(CAPABILITIES.impact.donations, false);
  assert.equal(CAPABILITIES.marketplace.payments, false);
  assert.equal(CAPABILITIES.games.realMoney, false);
  assert.equal(CAPABILITIES.crypto.transactionBroadcasting, false);
  assert.equal(CAPABILITIES.operations.productionReadiness, false);
});
