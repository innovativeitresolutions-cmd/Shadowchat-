import test from "node:test";
import assert from "node:assert/strict";
import {
  PLAN_TEMPLATES, progressOf, createHopePlan, normalizeHopePlan, toggleHopeStep,
  createImpactWorkspace, normalizeImpactWorkspace, addImpactTask,
  toggleImpactTask, removeImpactTask, handoffCampaignToHope
} from "../public/workflows.mjs";

test("HopeAI creates distinct domain-specific actionable plans", () => {
  const general = createHopePlan("  Ship an accessible beta  ", "product", "a", "2026-10-09");
  const charity = createHopePlan("Support community pantry", "charity", "b");
  assert.equal(general.goal, "Ship an accessible beta");
  assert.equal(general.template, "product");
  assert.equal(general.steps.length, 4);
  assert.notDeepEqual(general.steps.map((x) => x.title), charity.steps.map((x) => x.title));
  assert.equal(progressOf(general.steps).percent, 0);
  assert.equal(Object.keys(PLAN_TEMPLATES).length, 4);
});

test("HopeAI completion is reversible, measured, and immutable", () => {
  const plan = createHopePlan("Study TypeScript", "learning");
  const changed = toggleHopeStep(plan, "1");
  assert.equal(changed.steps[0].done, true);
  assert.equal(plan.steps[0].done, false);
  assert.equal(progressOf(changed.steps).percent, 25);
  assert.equal(progressOf(toggleHopeStep(changed, "1").steps).percent, 0);
  assert.throws(() => toggleHopeStep(plan, "absent"), /Unknown/);
});

test("HopeAI migration preserves old browser plans", () => {
  const plan = normalizeHopePlan({ t: "  Old draft  ", steps: ["Step one", "Step two"] }, 2);
  assert.equal(plan.id, "legacy-2");
  assert.equal(plan.goal, "Old draft");
  assert.equal(plan.steps[0].title, "Step one");
  assert.equal(plan.steps[0].done, false);
  assert.equal(normalizeHopePlan({ t: "" }), null);
  assert.throws(() => createHopePlan(" "), /required/);
  assert.throws(() => createHopePlan("a".repeat(501)), /500/);
});

test("Impact planning never treats intent as donated money or charity verification", () => {
  const plan = createImpactWorkspace({ title: "  Food pantry  ", goal: "Organize volunteers", pledgeIntent: "10.25" }, "p");
  assert.equal(plan.title, "Food pantry");
  assert.equal(plan.pledgeIntent, 10.25);
  assert.equal(plan.moneyMoved, false);
  assert.equal(plan.charityVerified, false);
  assert.equal(plan.tasks.length, 0);
  assert.throws(() => createImpactWorkspace({ title: "x", goal: "y", pledgeIntent: -1 }), /Pledge/);
  assert.throws(() => createImpactWorkspace({ title: "x", goal: "y", pledgeIntent: "NaN" }), /Pledge/);
});

test("Impact actions are validated, trackable, and can be removed", () => {
  const campaign = createImpactWorkspace({ title: "Park cleanup", goal: "Make a safe plan" }, "c");
  const added = addImpactTask(campaign, "Call volunteer coordinator", "action-1");
  assert.equal(campaign.tasks.length, 0);
  assert.equal(added.tasks.length, 1);
  assert.throws(() => addImpactTask(added, "call volunteer coordinator", "action-2"), /already exists/);
  assert.throws(() => addImpactTask(added, "x".repeat(161), "action-3"), /160/);
  const done = toggleImpactTask(added, "action-1");
  assert.equal(progressOf(done.tasks).percent, 100);
  assert.equal(progressOf(removeImpactTask(done, "action-1").tasks).percent, 0);
  assert.throws(() => toggleImpactTask(added, "missing"), /Unknown/);
});

test("Impact legacy imports cannot set verified or money-moved status", () => {
  const migrated = normalizeImpactWorkspace({
    t: "Old charity draft", g: "Collect information", p: 12,
    moneyMoved: true, charityVerified: true,
    tasks: [{ id: "t", title: "Confirm partner", done: true }]
  });
  assert.equal(migrated.moneyMoved, false);
  assert.equal(migrated.charityVerified, false);
  assert.equal(migrated.tasks[0].done, true);
  assert.equal(normalizeImpactWorkspace({ t: "No goal" }), null);
});

test("Impact-to-Hope handoff generates a linked charity plan", () => {
  const campaign = createImpactWorkspace({ title: "Food pantry", goal: "Coordinate volunteers" }, "c");
  const plan = handoffCampaignToHope(campaign, "h", "2026-10-09");
  assert.equal(plan.sourceCampaignId, "c");
  assert.equal(plan.template, "charity");
  assert.match(plan.goal, /Food pantry/);
  assert.equal(plan.steps.every((s) => s.done === false), true);
});
