import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createServiceCheckout } from "../src/payment-service.mjs";

test("Stripe checkout creates a provider session and only a matched signed webhook records payment", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sky4-stripe-ledger-"));
  const ledgerFile = path.join(dir, "payments.json");
  const host = "https://checkout-test.example";
  const secret = "whsec_reallyrandomtestingsecret";
  const env = {
    PUBLIC_BASE_URL: host, STRIPE_LEDGER_FILE: ledgerFile,
    STRIPE_SECRET_KEY: "sk_test_sandboxonlycredential",
    STRIPE_SERVICE_PRICE_ID: "price_123456789",
    STRIPE_WEBHOOK_SECRET: secret
  };
  let providerCalls = 0;
  const checkout = createServiceCheckout({
    env,
    fetchFn: async (url, options) => {
      providerCalls++;
      assert.equal(url, "https://api.stripe.com/v1/checkout/sessions");
      assert.match(options.body.toString(), /platform-membership/);
      assert.match(options.body.toString(), /price_123456789/);
      return { ok: true, json: async () => ({
        id: "cs_test_abcdefghijklmnopqrst",
        url: "https://checkout.stripe.com/c/pay/sandboxsession"
      }) };
    }
  });
  const server = http.createServer((req, res) => {
    // Simulate a reverse proxy preserving the configured public TLS hostname.
    req.headers.host = "checkout-test.example";
    return checkout.handle(req, res, new URL(req.url, "http://127.0.0.1"),
      { currentUser: () => ({ username: "creator" }) });
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  t.after(async () => { await new Promise((done) => server.close(done)); fs.rmSync(dir, { recursive:true, force:true }); });
  const base = "http://127.0.0.1:" + server.address().port;
  const get = async (method, uri, payload, headers = {}) => {
    const response = await fetch(base + uri, { method, headers: { Host: "checkout-test.example", Origin: host, ...headers }, body: payload });
    return { code: response.status, json: await response.json() };
  };
  const status = await get("GET", "/api/payments/status");
  assert.equal(status.code, 200);
  assert.equal(status.json.available, true);
  assert.equal(status.json.issuerInvestmentsAvailable, false);
  const opened = await get("POST", "/api/payments/create-checkout", "{}");
  assert.equal(opened.code, 200);
  assert.equal(opened.json.chargeVerified, false);
  assert.equal(providerCalls, 1);

  function sign(body) {
    const timestamp = Math.floor(Date.now() / 1000);
    const sig = crypto.createHmac("sha256", secret).update(timestamp + ".").update(body).digest("hex");
    return "t=" + timestamp + ",v1=" + sig;
  }
  const forged = {
    id: "evt_otherid", type: "checkout.session.completed", data: { object: {
      id: "cs_test_other", mode:"payment", payment_status:"paid",
      livemode:false, amount_total:500, currency:"usd",
      metadata: { product:"platform-membership", username:"creator" }
    } }
  };
  let payload = JSON.stringify(forged);
  assert.equal((await get("POST", "/api/payments/stripe-webhook", payload, {
    "Stripe-Signature": sign(payload)
  })).code, 200);
  assert.equal(JSON.parse(fs.readFileSync(ledgerFile, "utf8")).paidSessions.length, 0);
  const trueEvent = { ...forged, id: "evt_valid", data:{object:{
    ...forged.data.object, id:"cs_test_abcdefghijklmnopqrst"
  } } };
  payload = JSON.stringify(trueEvent);
  assert.equal((await get("POST", "/api/payments/stripe-webhook", payload, {
    "Stripe-Signature": "t=1,v1=abc"
  })).code, 400);
  assert.equal(JSON.parse(fs.readFileSync(ledgerFile, "utf8")).paidSessions.length, 0);
  const headers = { "Stripe-Signature": sign(payload) };
  assert.equal((await get("POST", "/api/payments/stripe-webhook", payload, headers)).code, 200);
  assert.equal((await get("POST", "/api/payments/stripe-webhook", payload, headers)).code, 200);
  const verified = JSON.parse(fs.readFileSync(ledgerFile, "utf8"));
  assert.equal(verified.paidSessions.length, 1);
  assert.equal(verified.paidSessions[0].username, "creator");
});
