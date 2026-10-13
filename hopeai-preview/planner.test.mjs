import {test} from "node:test";
import assert from "node:assert/strict";
import {makePlan} from "./planner-core.mjs";

test("learning planner delivers a deterministic, useful pathway", () => {
  const a = makePlan({type:"learning",goal:"SQL joins",minutes:30});
  const b = makePlan({type:"learning",goal:"SQL joins",minutes:"30"});
  assert.deepEqual(a,b);
  assert.equal(a.steps.length,6);
  assert.match(a.markdown,/Learning pathway/);
  assert.match(a.markdown,/SQL joins/);
  assert.match(a.markdown,/not an AI response/);
  assert.match(a.markdown,/No data was sent/);
});

test("volunteer and builder planning have truthful safety boundaries", () => {
  const action = makePlan({type:"volunteer",goal:"Community food drive",minutes:15});
  assert.match(action.markdown,/verify its contact details/);
  assert.match(action.markdown,/no charity verification/i);
  const release = makePlan({type:"build",goal:"HopeAI beta",minutes:60});
  assert.match(release.markdown,/error handling, tests/);
  assert.match(release.markdown,/exact deployed revision/);
  assert.match(release.markdown,/does not deploy software/);
});

test("invalid workflow, oversized or unsafe input, and invalid time fail closed", () => {
  for (const bad of [
    {type:"other",goal:"Anything",minutes:30},
    {type:"learning",goal:" ",minutes:30},
    {type:"learning",goal:"z".repeat(121),minutes:30},
    {type:"learning",goal:"private\ncredential",minutes:30},
    {type:"learning",goal:"Math",minutes:999},
    {type:"learning",goal:4,minutes:30},
    null
  ]) assert.throws(() => makePlan(bad));
});
