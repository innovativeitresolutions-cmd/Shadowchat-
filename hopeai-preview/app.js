"use strict";
(() => {
  const el = id => document.getElementById(id);
  const gate = el("gate"), studio = el("studio"), loginForm = el("login-form");
  const box = el("messages"), status = el("status");
  const names = { general: "What can I help with?", learning: "Let's learn together.",
    charity: "Let's make a difference.", code: "Let's build something." };
  let csrf = "", mode = "general", turns = [], busy = false;
  async function request(path, options = {}) {
    const result = await fetch(path, { credentials: "same-origin", cache: "no-store",
      ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
    const data = await result.json().catch(() => ({}));
    if (!result.ok) { const error = new Error(data.error || "request_failed");
      error.status = result.status; throw error; }
    return data;
  }
  function screen(active) {
    gate.hidden = active; studio.hidden = !active; el("logout").hidden = !active;
    if (active) el("prompt").focus();
  }
  function reset() {
    turns = []; box.querySelectorAll(".message").forEach(node => node.remove());
    el("empty").hidden = false; el("export").disabled = true; status.textContent = "";
  }
  async function refresh() {
    try { const data = await request("/api/session"); csrf = data.csrf;
      el("label").textContent = "INVITE BETA"; screen(true);
    } catch { csrf = ""; reset(); screen(false); }
  }
  async function bootstrap() {
    try {
      const data = await request("/api/config");
      if (data.ai_ready) {
        el("label").textContent = "INVITE BETA";
        el("readiness").textContent = "Private beta is configured. Sign in using your individual invitation.";
        loginForm.hidden = false;
      } else {
        el("label").textContent = "LOCAL AI CHAT LIVE";
        el("readiness").textContent = "HopeAI Chat below works using a real open-weight language model downloaded to your own device—no OpenAI quota needed. The hosted OpenAI-backed chat remains unavailable, but the local AI and planning tools are usable now. Try the quick model on Wi-Fi. Responses may be slow or inaccurate.";
        loginForm.hidden = true;
      }
      await refresh();
    } catch {
      el("readiness").textContent = "Cannot verify the beta configuration. Please try again.";
      loginForm.hidden = true;
    }
  }
  loginForm.addEventListener("submit", async event => {
    event.preventDefault(); el("error").textContent = "";
    const code = el("code").value; el("code").value = "";
    try {
      await request("/api/login", { method: "POST", body: JSON.stringify({code}) });
      await refresh();
    } catch (e) {
      el("error").textContent = e.status === 429 ? "Too many attempts. Try again later." :
        "Unable to sign in. Verify your invitation code.";
    }
  });
  el("logout").addEventListener("click", async () => {
    try {
      await request("/api/logout", { method: "POST", headers: { "X-HopeAI-CSRF": csrf },
        body: "{}" });
      csrf = ""; reset(); await refresh();
    } catch { status.textContent = "Sign-out could not be verified."; }
  });
  function display(role, text) {
    el("empty").hidden = true;
    const row = document.createElement("div"); row.className = "message " + role;
    const avatar = document.createElement("div"); avatar.className = "avatar";
    avatar.textContent = role === "assistant" ? "✦" : "●"; avatar.setAttribute("aria-hidden", "true");
    const copy = document.createElement("div"); copy.className = "bubble";
    const speaker = document.createElement("div"); speaker.className = "speaker";
    speaker.textContent = role === "assistant" ? "HOPEAI" : "YOU";
    const answer = document.createElement("div"); answer.textContent = text;
    copy.append(speaker, answer); row.append(avatar, copy);
    box.appendChild(row); box.scrollTop = box.scrollHeight;
  }
  el("new").addEventListener("click", () => { if (!busy) { reset(); el("prompt").focus(); } });
  document.querySelectorAll("[data-mode]").forEach(button => {
    button.addEventListener("click", () => {
      if (busy) return;
      mode = button.dataset.mode; el("chat-title").textContent = names[mode];
      document.querySelectorAll("[data-mode]").forEach(b => {
        b.classList.toggle("selected", b === button);
        b.setAttribute("aria-pressed", String(b === button));
      });
      reset(); el("prompt").focus();
    });
  });
  document.querySelectorAll("[data-suggest]").forEach(button =>
    button.addEventListener("click", () => { el("prompt").value = button.dataset.suggest; el("prompt").focus(); }));
  el("export").addEventListener("click", () => {
    if (!turns.length) return;
    const lines = ["# HopeAI chat (local export)", "Mode: " + mode, "Exported: " + new Date().toISOString(),
      "This file exists only on your device; no server-side chat history is available.", ""];
    turns.forEach(t => lines.push("## " + (t.role === "user" ? "You" : "HopeAI"), t.content, ""));
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown" }));
    const link = document.createElement("a"); link.href = url;
    link.download = "hopeai-chat.md"; document.body.appendChild(link);
    link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
    status.textContent = "Conversation exported to your device.";
  });
  el("chat-form").addEventListener("submit", async event => {
    event.preventDefault();
    const text = el("prompt").value.trim();
    if (busy || !csrf || !text) return;
    busy = true; el("send").disabled = true; el("prompt").disabled = true;
    status.textContent = "HopeAI is thinking…";
    try {
      const data = await request("/api/chat", { method: "POST",
        headers: { "X-HopeAI-CSRF": csrf },
        body: JSON.stringify({ message: text, mode, history: turns.slice(-4).map(
          t => ({ role: t.role, content: t.content.slice(0, 500) })) }) });
      display("user", text); display("assistant", data.answer);
      turns.push({role: "user", content: text}, {role: "assistant", content: data.answer});
      el("export").disabled = false; el("prompt").value = "";
      status.textContent = data.truncated ? "Answer shortened to fit this beta." : "";
    } catch (e) {
      if (e.status === 401) { status.textContent = "Session expired. Sign in again."; await refresh(); }
      else if (e.status === 429) status.textContent = "Request quota reached; retry later.";
      else if (e.status === 503) status.textContent = "AI provider unavailable. Your message was not processed.";
      else status.textContent = "Could not send that message. Try again.";
    } finally { busy = false; el("send").disabled = false; el("prompt").disabled = false;
      if (!studio.hidden) el("prompt").focus(); }
  });
  el("prompt").addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault(); el("chat-form").requestSubmit();
    }
  });
  bootstrap();
})();
