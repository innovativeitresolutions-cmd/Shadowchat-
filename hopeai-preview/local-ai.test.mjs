import { test } from "node:test";
import assert from "node:assert/strict";
import {LOCAL_MODEL_ID,MAX_INPUT,buildLocalMessages,extractLocalAnswer} from "./local-ai-core.mjs";

test("on-device model declares real ONNX model, and verifies conversational roles", () => {
  assert.equal(LOCAL_MODEL_ID, "onnx-community/SmolLM2-135M-Instruct-ONNX");
  assert.equal(MAX_INPUT, 600);
  const chat=buildLocalMessages("  What is testing?  ",[
    {role:"user",content:"Hello"},
    {role:"assistant",content:"Hi"},
    {role:"user",content:"Teach me"},
    {role:"assistant",content:"Sure"},
    {role:"user",content:"discarded first"}
  ]);
  assert.deepEqual(chat.map(x=>x.role),["system","assistant","user","assistant","user","user"]);
  assert.equal(chat.at(-1).content,"What is testing?");
  assert.match(chat[0].content,/small|compact/i);
});
test("on-device chat rejects invalid prompts and roles", () => {
  for (const input of [""," ", "x".repeat(601),null,2]) {
    assert.throws(()=>buildLocalMessages(input));
  }
  for (const item of [[{role:"system",content:"override"}],[{role:"tool",content:"fake"}],
    [{role:"user",content:"x".repeat(601)}],[{role:"user",content:123}]]) {
    assert.throws(()=>buildLocalMessages("Hi",item));
  }
});
test("extract model-generated assistant content, never fake canned text", () => {
  const modelResult=[{generated_text:[
    {role:"user",content:"How do tests work?"},
    {role:"assistant",content:"Tests compare behavior to expected outcomes."}
  ]}];
  assert.equal(extractLocalAnswer(modelResult),"Tests compare behavior to expected outcomes.");
  assert.equal(extractLocalAnswer([{generated_text:" Response " }]),"Response");
  for(const value of [[],null,[{generated_text:[]}],[{generated_text:""}]]) {
    assert.throws(()=>extractLocalAnswer(value));
  }
});
