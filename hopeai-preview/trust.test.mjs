import {test} from "node:test";
import assert from "node:assert/strict";
import {groundedProjectAnswer,validateProjectNotes} from "./trust.mjs";

test("founder identity is project-sourced rather than hallucinated",()=>{
  for(const question of [
    "Who is Skyler Blue Spillers?",
    "tell me about Skyler Blue Spiller",
    "What is Skyler Spillers known for?"
  ]){
    const response=groundedProjectAnswer(question);
    assert.equal(response?.kind,"project_note");
    assert.match(response.answer,/SKYCOIN4444/);
    assert.match(response.answer,/HopeAI/);
    assert.match(response.answer,/independently verified biography/);
    assert.match(response.label,/not AI-generated/);
    assert.doesNotMatch(response.answer,/beach|accident|speech|hacked|government|hospital/);
  }
  assert.equal(groundedProjectAnswer("Explain JavaScript"),null);
  assert.equal(groundedProjectAnswer("Skyler Blue Spillers"),null);
});
test("private identity queries should not invent a name",()=>{
  const r=groundedProjectAnswer("Who am I?");
  assert.equal(r.kind,"identity_limit");
  assert.match(r.answer,/can't know your identity/);
  assert.equal(groundedProjectAnswer("Where can I get food?"),null);
});
test("optional project notes are bounded, sanitized and never required",()=>{
  assert.equal(validateProjectNotes("  I am building HopeAI.  "),"I am building HopeAI.");
  assert.equal(validateProjectNotes(""),"");
  for(const value of [null,123,"x".repeat(601),"a\u0000b","hi\u0007there"]){
    assert.throws(()=>validateProjectNotes(value));
  }
});
