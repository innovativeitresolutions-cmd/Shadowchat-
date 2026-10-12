import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const jsonResponse = (res, status, value, extra = {}) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extra });
  res.end(JSON.stringify(value));
};
const cookieValue = (req, name) => {
  const pair = String(req.headers.cookie || "").split(";").map((v) => v.trim()).find((x) => x.startsWith(name + "="));
  return pair ? pair.slice(name.length + 1) : null;
};
const slug = (value) => typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,39}$/.test(value) ? value : null;
const text = (value, length) => typeof value === "string" && value.trim().length > 0 && value.trim().length <= length ? value.trim() : null;
const unsafe = /\b(?:guaranteed profits?|risk.free returns?|send (?:your )?(?:seed phrase|private key)|send (?:money|crypto) (?:to|now))\b/i;
const safeId = () => crypto.randomBytes(16).toString("hex");
const newState = () => ({ users: [], sessions: [], messages: [] });

export function createCryptoChatService({ dataFile = process.env.CRYPTOCHAT_DATA_FILE, now = () => Date.now() } = {}) {
  const enabled = typeof dataFile === "string" && dataFile.length > 0;
  let state = newState();
  const listeners = new Set();
  const limits = new Map();
  if (enabled) {
    try {
      const loaded = JSON.parse(fs.readFileSync(dataFile, "utf8"));
      if (!Array.isArray(loaded.users) || !Array.isArray(loaded.sessions) || !Array.isArray(loaded.messages)) throw new Error("invalid store format");
      state = loaded;
    } catch (err) {
      if (err.code !== "ENOENT") throw err; // Fail closed rather than lose data on invalid storage.
    }
    const dir = path.dirname(path.resolve(dataFile));
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  function save() {
    if (!enabled) throw new Error("Chat requires CRYPTOCHAT_DATA_FILE.");
    const temp = dataFile + "." + process.pid + ".tmp";
    fs.writeFileSync(temp, JSON.stringify(state), { encoding: "utf8", mode: 0o600, flag: "w" });
    fs.renameSync(temp, dataFile);
  }
  function limit(key, count, windowMs) {
    const t = now(), current = limits.get(key) || [];
    const recent = current.filter((n) => n > t - windowMs);
    if (recent.length >= count) return false;
    recent.push(t);
    limits.set(key, recent);
    if (limits.size > 2000) for (const [k, values] of limits) if (values.every((v) => v < t - 3600000)) limits.delete(k);
    return true;
  }
  function sessionUser(req) {
    const token = cookieValue(req, "sky4chat_session");
    if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
    const current = state.sessions.find((s) => s.tokenHash === hash(token) && s.expiresAt > now());
    return current ? state.users.find((u) => u.id === current.userId) || null : null;
  }
  function setSession(res, user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = now() + 7 * 86400000;
    state.sessions = state.sessions.filter((s) => s.expiresAt > now());
    state.sessions.push({ tokenHash: hash(token), userId: user.id, expiresAt });
    save();
    const secure = process.env.PUBLIC_BASE_URL?.startsWith("https://") ? "; Secure" : "";
    res.setHeader("Set-Cookie", "sky4chat_session=" + token + "; HttpOnly; SameSite=Strict; Path=/api/chat; Max-Age=604800" + secure);
  }
  function sameOrigin(req) {
    const origin = req.headers.origin;
    if (!origin) return false;
    try {
      const u = new URL(origin);
      return u.host === req.headers.host && (u.protocol === "https:" || (u.protocol === "http:" && /^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/.test(u.host)));
    } catch { return false; }
  }
  async function readBody(req) {
    const parts = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 4096) throw Object.assign(new Error("Request too large"), { status: 413 });
      parts.push(chunk);
    }
    try {
      const value = JSON.parse(Buffer.concat(parts).toString("utf8"));
      if (!value || Array.isArray(value) || typeof value !== "object") throw new Error("Invalid JSON object");
      return value;
    } catch { throw Object.assign(new Error("Invalid JSON object"), { status: 400 }); }
  }
  function broadcast(message) {
    for (const client of listeners) {
      if (client.room !== message.room) continue;
      try { client.res.write("event: message\ndata: " + JSON.stringify(message) + "\n\n"); }
      catch { listeners.delete(client); }
    }
  }
  async function handle(req, res, url) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("Cache-Control", "no-store");
    if (!enabled) return jsonResponse(res, 503, { available: false, reason: "Server chat persistence is not configured." });
    const target = url.pathname.slice("/api/chat".length);
    if (req.method === "GET" && target === "/status")
      return jsonResponse(res, 200, { available: true, persistence: "single-instance-durable-file", transport: "server-sent-events", financialServices: false, identityVerified: false });
    if (req.method !== "GET" && !sameOrigin(req))
      return jsonResponse(res, 403, { error: "Same-origin request required." });
    if (req.method === "POST" && (target === "/register" || target === "/login")) {
      const ip = req.socket.remoteAddress || "unknown";
      if (!limit(ip + target, target === "/register" ? 4 : 8, 3600000))
        return jsonResponse(res, 429, { error: "Too many attempts." });
      const input = await readBody(req);
      const username = typeof input.username === "string" ? input.username.trim().toLowerCase() : "";
      const password = input.password;
      if (!/^[a-z0-9_]{3,24}$/.test(username) || typeof password !== "string" || password.length < 12 || password.length > 256)
        return jsonResponse(res, 400, { error: "Use 3–24 lowercase username characters and password of at least 12 characters." });
      let user = state.users.find((u) => u.username === username);
      if (target === "/register") {
        if (user) return jsonResponse(res, 409, { error: "Username unavailable." });
        const salt = crypto.randomBytes(16).toString("hex");
        user = { id: safeId(), username, salt, passwordHash: crypto.scryptSync(password, salt, 32).toString("hex"), joinedAt: now() };
        state.users.push(user);
        save();
      } else {
        const secret = crypto.scryptSync(password, user?.salt || "invalid-dummy-salt", 32);
        const expected = Buffer.from(user?.passwordHash || "0".repeat(64), "hex");
        if (!crypto.timingSafeEqual(secret, expected)) return jsonResponse(res, 401, { error: "Invalid credentials." });
      }
      setSession(res, user);
      return jsonResponse(res, 200, { username: user.username, identityVerified: false });
    }
    const user = sessionUser(req);
    if (!user) return jsonResponse(res, 401, { error: "Login required." });
    if (req.method === "GET" && target === "/me")
      return jsonResponse(res, 200, { username: user.username, identityVerified: false });
    if (req.method === "POST" && target === "/logout") {
      const token = cookieValue(req, "sky4chat_session");
      state.sessions = state.sessions.filter((s) => s.tokenHash !== hash(token || ""));
      save();
      res.setHeader("Set-Cookie", "sky4chat_session=; HttpOnly; SameSite=Strict; Path=/api/chat; Max-Age=0");
      return jsonResponse(res, 200, { loggedOut: true });
    }
    const room = slug(url.searchParams.get("room"));
    if ((target === "/messages" || target === "/stream" || target === "/send") && !room)
      return jsonResponse(res, 400, { error: "Use a valid cryptocurrency room slug (1–40 lowercase letters, numbers or hyphens)." });
    if (req.method === "GET" && target === "/messages") {
      const messages = state.messages.filter((m) => m.room === room).slice(-50);
      return jsonResponse(res, 200, { room, messages, deliveredFromServer: true });
    }
    if (req.method === "POST" && target === "/send") {
      if (!limit("post:" + user.id, 20, 60000)) return jsonResponse(res, 429, { error: "Message rate limit exceeded." });
      const input = await readBody(req);
      const body = text(input.message, 500);
      if (!body || unsafe.test(body)) return jsonResponse(res, 400, { error: "Message is empty, too long or blocked by basic scam filters." });
      const message = { id: safeId(), room, username: user.username, message: body, createdAt: new Date(now()).toISOString() };
      state.messages.push(message);
      if (state.messages.length > 10000) state.messages = state.messages.slice(-9500);
      save();
      broadcast(message);
      return jsonResponse(res, 201, { message, deliveredFromServer: true });
    }
    if (req.method === "GET" && target === "/stream") {
      if (listeners.size >= 250) return jsonResponse(res, 503, { error: "Server chat connection capacity reached." });
      res.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-store", "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      });
      res.write('event: ready\ndata: {"realtime":true}\n\n');
      const client = { room, res };
      listeners.add(client);
      const interval = setInterval(() => {
        if (!sessionUser(req)) { res.end(); listeners.delete(client); return; }
        try { res.write(": heartbeat\n\n"); } catch { listeners.delete(client); }
      }, 25000);
      res.once("close", () => { clearInterval(interval); listeners.delete(client); });
      return;
    }
    return jsonResponse(res, 404, { error: "Unknown chat endpoint." });
  }
  return {
    enabled,
    currentUser: sessionUser,
    handle: async (req, res, url) => {
      try { await handle(req, res, url); }
      catch (err) {
        if (!res.headersSent) jsonResponse(res, err.status || 500, { error: err.status ? err.message : "Chat temporarily unavailable." });
        else res.end();
      }
    },
    close: () => { for (const listener of listeners) listener.res.end(); listeners.clear(); },
  };
}
