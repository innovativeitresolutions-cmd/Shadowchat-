// Real network transport: server-authenticated single-instance multiuser SSE rooms.
// No simulated audience or delivery receipts; a network error is visible.
let currentSource = null;
let activeRoom = null;
const escape = (v) => String(v ?? "").replace(/[&<>"']/g, (ch) =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]);
const close = () => { if (currentSource) currentSource.close(); currentSource = null; activeRoom = null; };
addEventListener("hashchange", close);
async function request(endpoint, options) {
  const res = await fetch("/api/chat/" + endpoint, {
    credentials: "same-origin", cache: "no-store",
    ...(options || {})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.reason || "Chat request failed (" + res.status + ").");
  return data;
}
const body = (data) => ({ method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(data) });
const info = (node, message, bad = false) => {
  if (node) { node.textContent = message; node.className = bad ? "bad" : "good"; }
};
export function renderRealtimeChatSection() {
  return '<section class="card" id="live-crypto-chat">' +
    '<h2>Live cryptocurrency discussion</h2>' +
    '<p>Authenticated, server-delivered messages across connected users. Access requires a server persistence volume and registration. No identity verification or investment execution.</p>' +
    '<div id="crypto-chat-root" aria-live="polite">Checking service availability…</div>' +
    '</section>';
}
export async function bindRealtimeChat() {
  close();
  const root = document.getElementById("crypto-chat-root");
  if (!root) return;
  let available;
  try {
    const response = await fetch("/api/chat/status", { cache:"no-store" });
    available = await response.json();
    if (!response.ok || !available.available) throw new Error(available.reason || "Server chat is disabled.");
  } catch (err) {
    info(root, "Real-time chat unavailable: " + err.message, true);
    return;
  }
  if (!root.isConnected || location.hash.slice(2) !== "launchpad") return;
  let me = null;
  try { me = await request("me"); } catch {}
  if (!root.isConnected || location.hash.slice(2) !== "launchpad") return;
  if (!me) {
    root.innerHTML = '<p>Create a chat account or sign in. Usernames are not verified identities.</p>' +
      '<form id="crypto-chat-auth" class="launchpad-form">' +
      '<label>Username<input name="username" autocomplete="username" minlength="3" maxlength="24" pattern="[a-zA-Z0-9_]+" required></label>' +
      '<label>Password (12+ characters)<input name="password" type="password" autocomplete="current-password" minlength="12" required></label>' +
      '<div class="actions"><button class="btn primary" type="submit" name="action" value="login">Sign in</button>' +
      '<button class="btn" type="submit" name="action" value="register">Register account</button></div>' +
      '<p id="chat-auth-feedback" role="alert"></p></form>';
    root.querySelector("#crypto-chat-auth").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = Object.fromEntries(new FormData(form));
      const action = event.submitter?.value === "register" ? "register" : "login";
      const status = root.querySelector("#chat-auth-feedback");
      form.querySelectorAll("button").forEach((btn) => btn.disabled = true);
      try {
        await request(action, body({ username: data.username, password: data.password }));
        form.querySelector('[name="password"]').value = "";
        bindRealtimeChat();
      } catch (error) {
        info(status, error.message, true);
        form.querySelectorAll("button").forEach((btn) => btn.disabled = false);
      }
    });
    return;
  }
  root.innerHTML = '<div class="actions"><span class="pill">Signed in: ' + escape(me.username) + '</span>' +
    '<button class="btn" id="crypto-chat-logout">Sign out</button></div>' +
    '<label>Cryptocurrency room (share this slug with other participants)' +
    '<input id="crypto-chat-room" maxlength="40" value="general" pattern="[a-z0-9][a-z0-9-]{0,39}"></label>' +
    '<button class="btn" id="crypto-chat-join">Join room</button>' +
    '<p id="crypto-chat-state" role="status"></p>' +
    '<div id="crypto-chat-feed" class="item" role="log" aria-live="polite" aria-relevant="additions" style="max-height:340px;overflow:auto"></div>' +
    '<form id="crypto-chat-send" class="launchpad-form"><label>Message<input name="message" maxlength="500" required>' +
    '</label><button class="btn primary" type="submit">Send to room</button></form>' +
    '<p class="notice">Messages are visible to anyone signed in to the same room; do not share wallet secrets or private financial information. Rate limits and a basic anti-scam screen apply.</p>';
  const state = root.querySelector("#crypto-chat-state");
  const feed = root.querySelector("#crypto-chat-feed");
  const seen = new Set();
  const appendMessage = (msg) => {
    if (seen.has(msg.id)) return;
    seen.add(msg.id);
    const article = document.createElement("article");
    article.className = "item";
    const name = document.createElement("strong"); name.textContent = msg.username;
    const time = document.createElement("small"); time.textContent = " · " + new Date(msg.createdAt).toLocaleString();
    const paragraph = document.createElement("p"); paragraph.textContent = msg.message;
    article.append(name, time, paragraph);
    feed.append(article);
    while (feed.children.length > 100) feed.firstElementChild.remove();
    feed.scrollTop = feed.scrollHeight;
  };
  async function connect(room) {
    close();
    seen.clear();
    feed.replaceChildren();
    const roomSlug = /^[a-z0-9][a-z0-9-]{0,39}$/.test(room) ? room : null;
    if (!roomSlug) return info(state, "Room slug must be 1–40 lowercase letters, digits, or hyphens.", true);
    activeRoom = roomSlug;
    try {
      const history = await request("messages?room=" + encodeURIComponent(roomSlug));
      if (!root.isConnected || activeRoom !== roomSlug) return;
      history.messages.forEach(appendMessage);
      const stream = new EventSource("/api/chat/stream?room=" + encodeURIComponent(roomSlug), { withCredentials: true });
      currentSource = stream;
      stream.addEventListener("ready", () => info(state, "Connected to #" + roomSlug + " · live delivery enabled."));
      stream.addEventListener("message", (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.room === activeRoom) appendMessage(msg);
        } catch {}
      });
      stream.addEventListener("error", () => info(state, "Connection interrupted; reconnecting when available.", true));
    } catch (err) { info(state, err.message, true); }
  }
  root.querySelector("#crypto-chat-join").onclick = () => connect(root.querySelector("#crypto-chat-room").value.trim());
  root.querySelector("#crypto-chat-logout").onclick = async () => {
    close(); try { await request("logout", body({})); } catch {}
    bindRealtimeChat();
  };
  root.querySelector("#crypto-chat-send").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const message = new FormData(form).get("message");
    try {
      const result = await request("send?room=" + encodeURIComponent(activeRoom || "general"), body({ message }));
      appendMessage(result.message);
      form.reset();
      info(state, "Message delivered to server #" + activeRoom + "; connection delivery is best effort.");
    } catch (err) { info(state, err.message, true); }
  });
  connect("general");
}


// Card payments are only for an independently configured non-investment platform membership.
// Stripe's provider UI collects card details; this browser never sees or stores card numbers.
export function renderServicePaymentSection() {
  return '<section class="card" aria-label="Platform membership payments">' +
    '<h2>Platform service payments</h2>' +
    '<p>Optional non-investment platform membership only. Never a purchase of tokens, shares, an investment, or an ICO/IPO subscription. Provider price and checkout require operator configuration.</p>' +
    '<div id="crypto-payment-ui" role="status">Checking verified payment provider availability…</div></section>';
}
export async function bindServicePayments() {
  const root = document.getElementById("crypto-payment-ui");
  if (!root) return;
  try {
    const response = await fetch("/api/payments/status", { cache: "no-store" });
    const status = await response.json();
    if (!root.isConnected) return;
    if (!response.ok || !status.available) {
      info(root, "Payment processing is not configured on this server. No charge can occur.", true);
      return;
    }
    root.innerHTML = '<p class="good">Verified hosted checkout is configured for a separate platform membership product. Price is shown and collected by Stripe; purchase is not an investment.</p>' +
      '<button id="crypto-service-checkout" class="btn primary">Open secure membership checkout</button>' +
      '<p id="crypto-service-checkout-feedback" role="alert"></p>';
    root.querySelector("#crypto-service-checkout").onclick = async () => {
      const button = root.querySelector("#crypto-service-checkout");
      const feedback = root.querySelector("#crypto-service-checkout-feedback");
      button.disabled = true;
      try {
        const response = await fetch("/api/payments/create-checkout", {
          method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
          body: "{}"
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Checkout unavailable.");
        const url = new URL(result.checkoutUrl);
        if (url.origin !== "https://checkout.stripe.com") throw new Error("Unexpected provider checkout host.");
        window.location.assign(url.href);
      } catch (error) {
        info(feedback, error.message, true);
        button.disabled = false;
      }
    };
  } catch { if (root.isConnected) info(root, "Payment provider status unavailable.", true); }
}
