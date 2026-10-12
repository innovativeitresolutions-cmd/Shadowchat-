import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const respond = (res, code, value) => {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
};
export function verifyStripeSignature(payload, header, secret, timeMs = Date.now()) {
  if (typeof secret !== "string" || !secret.startsWith("whsec_")) return false;
  const fragments = String(header || "").split(",").map((x) => x.trim());
  const t = fragments.find((v) => v.startsWith("t="))?.slice(2);
  const versions = fragments.filter((v) => v.startsWith("v1=")).map((v) => v.slice(3));
  if (!/^\d+$/.test(t || "") || Math.abs(timeMs - Number(t) * 1000) > 5 * 60000) return false;
  const expected = crypto.createHmac("sha256", secret).update(t + ".").update(payload).digest();
  return versions.some((v) => {
    if (!/^[a-fA-F0-9]{64}$/.test(v)) return false;
    return crypto.timingSafeEqual(Buffer.from(v, "hex"), expected);
  });
}
const configured = (env) =>
  /^sk_(test|live)_[A-Za-z0-9]+$/.test(env.STRIPE_SECRET_KEY || "") &&
  /^price_[A-Za-z0-9]+$/.test(env.STRIPE_SERVICE_PRICE_ID || "") &&
  /^whsec_[A-Za-z0-9]+$/.test(env.STRIPE_WEBHOOK_SECRET || "") &&
  /^https:\/\//.test(env.PUBLIC_BASE_URL || "") &&
  Boolean(env.STRIPE_LEDGER_FILE);

export function createServiceCheckout({
  env = process.env, now = () => Date.now(), fetchFn = fetch
} = {}) {
  const available = configured(env);
  let ledger = { seenEventIds: [], paidSessions: [], pendingSessions: [] };
  if (available) {
    try {
      const data = JSON.parse(fs.readFileSync(env.STRIPE_LEDGER_FILE, "utf8"));
      if (!Array.isArray(data.seenEventIds) || !Array.isArray(data.paidSessions) || !Array.isArray(data.pendingSessions)) throw new Error("Invalid payment ledger.");
      ledger = data;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    fs.mkdirSync(path.dirname(path.resolve(env.STRIPE_LEDGER_FILE)), { recursive: true, mode: 0o700 });
  }
  const store = () => {
    const filename = env.STRIPE_LEDGER_FILE + "." + process.pid + ".tmp";
    fs.writeFileSync(filename, JSON.stringify(ledger), { encoding: "utf8", mode: 0o600 });
    fs.renameSync(filename, env.STRIPE_LEDGER_FILE);
  };
  async function rawBody(req, maxBytes = 131072) {
    let length = 0, chunks = [];
    for await (const chunk of req) {
      length += chunk.length;
      if (length > maxBytes) throw Object.assign(new Error("Body exceeds limit."), { status: 413 });
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  async function handle(req, res, url, { currentUser }) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method === "GET" && url.pathname === "/api/payments/status")
      return respond(res, 200, {
        available, purpose: "non-investment platform membership only",
        issuerInvestmentsAvailable: false, tokenSalesAvailable: false,
        chargeState: "provider-webhook-only"
      });
    if (!available) return respond(res, 503, { available: false, error: "Payment provider and verified ledger are not configured." });
    if (req.method === "POST" && url.pathname === "/api/payments/stripe-webhook") {
      const raw = await rawBody(req);
      if (!verifyStripeSignature(raw, req.headers["stripe-signature"], env.STRIPE_WEBHOOK_SECRET, now()))
        return respond(res, 400, { error: "Invalid provider signature." });
      let event;
      try { event = JSON.parse(raw.toString("utf8")); } catch { return respond(res, 400, { error: "Invalid event." }); }
      if (!/^evt_[A-Za-z0-9]+$/.test(event.id || "")) return respond(res, 400, { error: "Invalid event ID." });
      if (ledger.seenEventIds.includes(event.id)) return respond(res, 200, { received: true, duplicate: true });
      // Webhook receipts are the only source of truth for completed purchases.
      const pending = ledger.pendingSessions.find((p) => p.sessionId === event.data?.object?.id);
      if (pending && event.type === "checkout.session.completed" &&
          event.data?.object?.mode === "payment" &&
          event.data.object.payment_status === "paid" &&
          event.data.object.metadata?.product === "platform-membership" &&
          event.data.object.metadata?.username === pending.username &&
          event.data.object.livemode === env.STRIPE_SECRET_KEY.startsWith("sk_live_") &&
          Number.isSafeInteger(event.data.object.amount_total) &&
          event.data.object.amount_total > 0 &&
          /^cs_(test|live)_[A-Za-z0-9]+$/.test(event.data.object.id || "")) {
        const session = event.data.object;
        if (!ledger.paidSessions.some((x) => x.sessionId === session.id)) {
          ledger.paidSessions.push({
            sessionId: session.id, username: String(session.metadata.username || "").slice(0, 24),
            amountTotal: Number(session.amount_total), currency: String(session.currency || "").slice(0, 8),
            paidAt: new Date(now()).toISOString()
          });
        }
      }
      ledger.seenEventIds.push(event.id);
      if (pending) ledger.pendingSessions = ledger.pendingSessions.filter((p) => p.sessionId !== pending.sessionId);
      store();
      return respond(res, 200, { received: true });
    }
    if (req.method === "POST" && url.pathname === "/api/payments/create-checkout") {
      const u = currentUser(req);
      if (!u) return respond(res, 401, { error: "Sign in to CryptoChat to purchase platform membership." });
      const origin = req.headers.origin;
      try {
        if (!origin || new URL(origin).host !== req.headers.host || origin !== env.PUBLIC_BASE_URL)
          return respond(res, 403, { error: "Unexpected checkout origin." });
      } catch { return respond(res, 403, { error: "Unexpected checkout origin." }); }
      // Price and product are server-side allowlisted; the buyer cannot set amounts or asset type.
      const args = new URLSearchParams({
        mode: "payment",
        "line_items[0][price]": env.STRIPE_SERVICE_PRICE_ID,
        "line_items[0][quantity]": "1",
        "metadata[product]": "platform-membership",
        "metadata[username]": u.username,
        "success_url": env.PUBLIC_BASE_URL + "/#/launchpad",
        "cancel_url": env.PUBLIC_BASE_URL + "/#/launchpad",
        "payment_method_types[0]": "card"
      });
      const requestKey = crypto.randomUUID();
      let upstream;
      try {
        upstream = await fetchFn("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST", headers: {
            Authorization: "Bearer " + env.STRIPE_SECRET_KEY,
            "Content-Type": "application/x-www-form-urlencoded",
            "Idempotency-Key": requestKey
          }, body: args, signal: AbortSignal.timeout(12000)
        });
      } catch { return respond(res, 502, { error: "Payment provider unreachable." }); }
      let result;
      try { result = await upstream.json(); } catch { return respond(res, 502, { error: "Invalid payment provider response." }); }
      if (!upstream.ok || typeof result.url !== "string" || !result.url.startsWith("https://checkout.stripe.com/"))
        return respond(res, 502, { error: "Provider did not create a checkout session." });
      if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(result.id || "")) return respond(res, 502, { error: "Invalid provider checkout session." });
      ledger.pendingSessions.push({ sessionId: result.id, username: u.username, createdAt: new Date(now()).toISOString() });
      store();
      return respond(res, 200, { checkoutUrl: result.url, chargeVerified: false, description: "Non-investment platform membership" });
    }
    return respond(res, 404, { error: "Unknown payments endpoint." });
  }
  return {
    available,
    handle: async (req, res, url, auth) => {
      try { await handle(req, res, url, auth); }
      catch (error) {
        if (!res.headersSent) respond(res, error.status || 500, { error: error.status ? error.message : "Payment service temporarily unavailable." });
        else res.end();
      }
    }
  };
}
