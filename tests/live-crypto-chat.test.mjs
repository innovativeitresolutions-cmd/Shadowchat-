import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { createCryptoChatService } from "../src/crypto-chat-service.mjs";
import { createServiceCheckout, verifyStripeSignature } from "../src/payment-service.mjs";

async function harness(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sky4-live-chat-"));
  const file = path.join(dir, "chat.json");
  const chat = createCryptoChatService({ dataFile: file });
  const server = http.createServer((req, res) => chat.handle(req, res,
    new URL(req.url, "http://" + req.headers.host)));
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const url = "http://127.0.0.1:" + server.address().port;
  t.after(async () => {
    chat.close();
    await new Promise((done) => server.close(done));
    fs.rmSync(dir, { recursive: true, force: true });
  });
  async function call(route, input, cookie) {
    const res = await fetch(url + "/api/chat" + route, {
      method: input ? "POST" : "GET",
      headers: { Origin: url, ...(input ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}) },
      ...(input ? { body: JSON.stringify(input) } : {})
    });
    return { status: res.status, data: await res.json(), cookie: res.headers.get("set-cookie")?.split(";")[0] };
  }
  return { chat, call, file, url };
}

test("disabled server never pretends to supply live chat", async () => {
  const chat = createCryptoChatService({ dataFile: "" });
  assert.equal(chat.enabled, false);
});
test("distinct users register, sign in, persist history, enforce rooms and logout", async (t) => {
  const { call, file, url } = await harness(t);
  const a = await call("/register", { username: "alice", password: "ALongUniquePass123!" });
  const b = await call("/register", { username: "bob", password: "AnotherVeryLongPass456!" });
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.notEqual(a.cookie, b.cookie);
  assert.equal((await call("/me", undefined, a.cookie)).data.username, "alice");
  assert.equal((await call("/messages?room=general")).status, 401);
  const sent = await call("/send?room=sky4", { message: "What is the utility model?" }, a.cookie);
  assert.equal(sent.status, 201);
  assert.equal(sent.data.message.username, "alice");
  assert.equal((await call("/messages?room=sky4", undefined, b.cookie)).data.messages.length, 1);
  assert.equal((await call("/messages?room=different", undefined, b.cookie)).data.messages.length, 0);
  assert.equal((await call("/send?room=sky4", { message: "Send your seed phrase" }, a.cookie)).status, 400);
  assert.equal((await call("/send?room=!bad", { message: "hello" }, a.cookie)).status, 400);
  assert.equal((await call("/send?room=sky4", { message: "hello" }, "sky4chat_session=bad")).status, 401);
  const raw = fs.readFileSync(file, "utf8");
  assert.ok(!raw.includes("ALongUniquePass123!"));
  assert.ok(!raw.includes(a.cookie.slice(17)));
  const persistent = createCryptoChatService({ dataFile: file });
  assert.equal(persistent.enabled, true);
  persistent.close();
  assert.equal((await call("/logout", {}, a.cookie)).status, 200);
  assert.equal((await call("/me", undefined, a.cookie)).status, 401);
  assert.equal((await call("/login", { username: "bob", password: "badpassword123" })).status, 401);
  assert.equal((await call("/login", { username: "bob", password: "AnotherVeryLongPass456!" })).status, 200);
});

test("SSE sends a real message from another authenticated account", async (t) => {
  const { call, url } = await harness(t);
  const a = await call("/register", { username: "owner", password: "some-owner-password" });
  const b = await call("/register", { username: "reader", password: "some-reader-password" });
  const controller = new AbortController();
  t.after(() => controller.abort());
  const response = await fetch(url + "/api/chat/stream?room=sky4", {
    headers: { Cookie: b.cookie }, signal: controller.signal
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/event-stream/);
  const reader = response.body.getReader();
  const first = await reader.read();
  assert.match(new TextDecoder().decode(first.value), /realtime/);
  const sent = await call("/send?room=sky4", { message: "Hello from the other account." }, a.cookie);
  assert.equal(sent.status, 201);
  const next = await reader.read();
  const delivered = new TextDecoder().decode(next.value);
  assert.match(delivered, /Hello from the other account/);
  assert.match(delivered, /owner/);
  controller.abort();
  await reader.cancel().catch(() => {});
});
test("cross-origin POST blocked even with correct credentials", async (t) => {
  const { url } = await harness(t);
  const res = await fetch(url + "/api/chat/register", {
    method:"POST", headers: { Origin: "https://attacker.example", "Content-Type":"application/json" },
    body:JSON.stringify({ username:"bad", password:"SomePassword123456" })
  });
  assert.equal(res.status, 403);
});
test("Stripe signed events verify timestamp and payload, not unverifiable success redirects", () => {
  const secret = "whsec_testsecret456";
  const body = Buffer.from('{"id":"evt_event123","type":"checkout.session.completed"}');
  const t = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac("sha256", secret).update(t + ".").update(body).digest("hex");
  const header = "t=" + t + ",v1=" + sig;
  assert.equal(verifyStripeSignature(body, header, secret), true);
  assert.equal(verifyStripeSignature(Buffer.from("tampered"), header, secret), false);
  assert.equal(verifyStripeSignature(body, header, secret, Date.now() + 600000), false);
  assert.equal(verifyStripeSignature(body, "t=" + t + ",v1=zz", secret), false);
  assert.equal(createServiceCheckout({ env:{} }).available, false);
});
