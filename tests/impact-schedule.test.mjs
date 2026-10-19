import test from "node:test";
import assert from "node:assert/strict";
import {
  planningDate, planningOwner, impactScheduleSummary
} from "../public/impact-schedule.mjs";
import {
  createImpactWorkspace, addImpactTask, updateImpactTaskSchedule,
  normalizeImpactWorkspace, toggleImpactTask
} from "../public/workflows.mjs";

const newCampaign = () => createImpactWorkspace({
  title: "Community pantry", goal: "Schedule volunteer packing shifts"
}, "demo-campaign");

test("volunteer planning dates use strict valid calendar days", () => {
  assert.equal(planningDate("2028-02-29"), "2028-02-29");
  assert.equal(planningDate(""), "");
  for (const bad of ["2027-02-29", "2026-02-30", "2026-13-01",
    "2026-00-15", "2026-1-1", "1999-12-31", "2101-01-01",
    "2026-10-19T00:00:00Z", true, "tomorrow"]) {
    assert.throws(() => planningDate(bad), RangeError);
  }
});

test("suggested owner fields are safe, bounded labels not identity records", () => {
  assert.equal(planningOwner("  Packing   shift A  "), "Packing shift A");
  assert.equal(planningOwner(""), "");
  assert.throws(() => planningOwner(123), TypeError);
  assert.throws(() => planningOwner("X".repeat(81)), RangeError);
  assert.throws(() => planningOwner("bad" + String.fromCharCode(0)), RangeError);
});

test("create action and reschedule remain immutable, with truthful campaign status", () => {
  const plan = newCampaign();
  const first = addImpactTask(plan, "Contact volunteer coordinator", "task-1",
    { ownerLabel: "  coordinator ", dueDate: "2026-10-20" });
  assert.deepEqual(plan.tasks, []);
  assert.equal(first.tasks[0].ownerLabel, "coordinator");
  assert.equal(first.tasks[0].dueDate, "2026-10-20");
  const later = updateImpactTaskSchedule(first, "task-1",
    { ownerLabel: "Shift B", dueDate: "2026-10-25" });
  assert.equal(first.tasks[0].dueDate, "2026-10-20");
  assert.equal(later.tasks[0].dueDate, "2026-10-25");
  assert.equal(later.tasks[0].ownerLabel, "Shift B");
  assert.equal(later.moneyMoved, false);
  assert.equal(later.charityVerified, false);
  assert.throws(() => updateImpactTaskSchedule(later, "unknown", {}), /Unknown/);
  assert.throws(() => addImpactTask(later, "New task", "task-2",
    { dueDate: "2026-02-30" }), /calendar/);
});

test("legacy action migration keeps done state and clears invalid untrusted metadata", () => {
  const legacy = normalizeImpactWorkspace({
    title: "Community pantry", goal: "Pack grocery boxes",
    charityVerified: true, moneyMoved: true,
    tasks: [
      { id:"one", title:"Pack food", done:true },
      { id:"two", title:"Call volunteers", done:false,
        ownerLabel: "<script>alert('x')</script>", dueDate: "2026-02-30" },
      { id:"three", title:"Review plan", ownerLabel: "  Local lead  ",
        dueDate: "2026-10-21", done:false },
    ]
  });
  assert.equal(legacy.moneyMoved, false);
  assert.equal(legacy.charityVerified, false);
  assert.equal(legacy.tasks[0].done, true);
  assert.equal(legacy.tasks[0].ownerLabel, "");
  assert.equal(legacy.tasks[0].dueDate, "");
  assert.equal(legacy.tasks[1].dueDate, "");
  // Labels are unverified strings, never HTML; the UI escapes them before display.
  assert.equal(legacy.tasks[1].ownerLabel, "<script>alert('x')</script>");
  assert.equal(legacy.tasks[2].ownerLabel, "Local lead");
});

test("UTC schedule summaries distinguish overdue, upcoming and finished actions", () => {
  let plan = newCampaign();
  plan = addImpactTask(plan, "Past date", "a", { dueDate: "2026-10-18" });
  plan = addImpactTask(plan, "Tomorrow", "b",
    { dueDate: "2026-10-20", ownerLabel: "Shift 1" });
  plan = addImpactTask(plan, "One week away", "c",
    { dueDate: "2026-10-26", ownerLabel: "Shift 2" });
  plan = addImpactTask(plan, "Unplanned", "d");
  plan = addImpactTask(plan, "Future", "e",
    { dueDate: "2026-11-30", ownerLabel: "Shift 3" });
  plan = toggleImpactTask(plan, "a");
  assert.deepEqual(impactScheduleSummary(plan, "2026-10-19"), {
    open: 4, completed: 1, unassigned: 1, scheduled: 3, overdue: 0, dueSoon: 2
  });
  plan = toggleImpactTask(plan, "a");
  assert.deepEqual(impactScheduleSummary(plan, "2026-10-19"), {
    open: 5, completed: 0, unassigned: 2, scheduled: 4, overdue: 1, dueSoon: 2
  });
  assert.throws(() => impactScheduleSummary(plan, "bad date"), RangeError);
});

test("editing the planning date never changes completion or task description", () => {
  const plan = addImpactTask(newCampaign(), "Schedule volunteers", "local");
  const done = toggleImpactTask(plan, "local");
  const changed = updateImpactTaskSchedule(done, "local",
    { ownerLabel: "Volunteer coordinator", dueDate: "2026-10-30" });
  assert.equal(changed.tasks[0].done, true);
  assert.equal(changed.tasks[0].title, "Schedule volunteers");
  assert.equal(changed.tasks[0].ownerLabel, "Volunteer coordinator");
  assert.equal(impactScheduleSummary(changed, "2026-10-19").scheduled, 0);
});
