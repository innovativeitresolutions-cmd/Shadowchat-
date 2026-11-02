const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const MAX_MESSAGES = 24;
const MAX_CONTENT = 8_000;

export function createHopeAIService({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = Date.now,
} = {}) {
  const requests = new Map();

  async function handle(req, res) {
    if (req.method !== "POST") {
      res.writeHead(405, { "Content-Type": "application/json", Allow: "POST" });
      return res.end(JSON.stringify({ error: "method_not_allowed" }));
    }

    const address = String(req.socket?.remoteAddress || "unknown");
    const current = now();
    const recent = (requests.get(address) || []).filter((time) => current - time < WINDOW_MS);
    if (recent.length >= MAX_REQUESTS) {
      requests.set(address, recent);
      res.writeHead(429, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "rate_limited", message: "Please wait a minute before sending more messages." }));
    }
    recent.push(current);
    requests.set(address, recent);

    const apiKey = env.HOPEAI_API_KEY;
    const model = env.HOPEAI_MODEL;
    const baseUrl = String(env.HOPEAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    if (!apiKey || !model) {
      res.writeHead(503, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        error: "provider_not_configured",
        message: "HopeAI's language model is not connected yet. No message was sent to an AI provider.",
      }));
    }

    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 64_000) {
        res.writeHead(413, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "request_too_large" }));
      }
    }

    let payload;
    try { payload = JSON.parse(body || "{}"); }
    catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "invalid_json" }));
    }

    const messages = payload.messages;
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > MAX_MESSAGES ||
        messages.some((item) => !item || !["user", "assistant"].includes(item.role) ||
          typeof item.content !== "string" || !item.content.trim() || item.content.length > MAX_CONTENT)) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "invalid_messages", message: "Send 1–24 user/assistant messages, each up to 8,000 characters." }));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetchImpl(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: "You are HopeAI, a helpful, honest, supportive general-purpose AI assistant. Be clear about uncertainty. Do not claim to perform external actions. For crisis or imminent self-harm, encourage immediate human support and emergency services." },
            ...messages,
          ],
          temperature: 0.7,
          stream: false,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        res.writeHead(response.status === 429 ? 503 : 502, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "provider_error", message: "HopeAI's provider is temporarily unavailable. Please try again later." }));
      }
      const result = await response.json();
      const answer = result?.choices?.[0]?.message?.content;
      if (typeof answer !== "string" || !answer.trim()) throw new Error("Provider returned no answer");
      res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
      return res.end(JSON.stringify({ message: answer, model }));
    } catch (error) {
      res.writeHead(502, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({
        error: "provider_unavailable",
        message: error?.name === "AbortError" ? "HopeAI timed out. Please try again." : "HopeAI could not reach its provider. Please try again.",
      }));
    } finally {
      clearTimeout(timeout);
    }
  }

  return { handle };
}
