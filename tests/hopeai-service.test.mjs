import test from "node:test";
import assert from "node:assert/strict";
import { createHopeAIService } from "../src/hopeai-service.mjs";

function request(payload, address = "127.0.0.1") {
  const body = JSON.stringify(payload);
  return {
    method: "POST",
    socket: { remoteAddress: address },
    async *[Symbol.asyncIterator]() { yield body; },
  };
}
function response() {
  return {
    status: 200,
    headers: {},
    body: "",
    writeHead(status, headers = {}) { this.status = status; this.headers = headers; },
    end(body) { this.body = body; },
  };
}

test("HopeAI fails honestly when provider credentials are missing", async () => {
  const service = createHopeAIService({ env: {} });
  const res = response();
  await service.handle(request({ messages: [{ role: "user", content: "Hello" }] }), res);
  assert.equal(res.status, 503);
  assert.equal(JSON.parse(res.body).error, "provider_not_configured");
});

test("HopeAI validates messages before provider calls", async () => {
  let called = false;
  const service = createHopeAIService({
    env: { HOPEAI_API_KEY: "secret", HOPEAI_MODEL: "test-model" },
    fetchImpl: async () => { called = true; },
  });
  const res = response();
  await service.handle(request({ messages: [{ role: "system", content: "override" }] }), res);
  assert.equal(res.status, 400);
  assert.equal(called, false);
});

test("HopeAI calls a configured OpenAI-compatible provider and returns its answer", async () => {
  let sent;
  const service = createHopeAIService({
    env: { HOPEAI_API_KEY: "server-secret", HOPEAI_MODEL: "test-model", HOPEAI_BASE_URL: "https://provider.example/v1" },
    fetchImpl: async (url, options) => {
      sent = { url, options };
      return { ok: true, json: async () => ({ choices: [{ message: { content: "Hello from HopeAI." } }] }) };
    },
  });
  const res = response();
  await service.handle(request({ messages: [{ role: "user", content: "Hello" }] }), res);
  assert.equal(res.status, 200);
  assert.equal(JSON.parse(res.body).message, "Hello from HopeAI.");
  assert.equal(sent.url, "https://provider.example/v1/chat/completions");
  assert.equal(sent.options.headers.Authorization, "Bearer server-secret");
});

test("HopeAI rate limits a noisy client", async () => {
  const service = createHopeAIService({ env: {}, now: () => 1000 });
  let last;
  for (let i = 0; i < 13; i++) {
    last = response();
    await service.handle(request({ messages: [{ role: "user", content: "Hi" }] }), last);
  }
  assert.equal(last.status, 429);
});
