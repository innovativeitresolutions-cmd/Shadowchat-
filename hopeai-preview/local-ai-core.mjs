/**
 * HopeAI Chat: real, local, open-weight language model contracts.
 * No simulated provider replies or hidden remote inference.
 */
export const LOCAL_MODELS = Object.freeze({
  quick: Object.freeze({id:"onnx-community/SmolLM2-135M-Instruct-ONNX",
    label:"Quick · 135M",size:"181 MB",description:"Best for phones and first-time testing."}),
  capable: Object.freeze({id:"onnx-community/SmolLM2-360M-Instruct-ONNX",
    label:"Better quality · 360M",size:"386 MB",description:"Experimental; needs more memory and processing time."})
});
export const LOCAL_MODEL_ID = LOCAL_MODELS.quick.id; // back-compat, tested default
export const MAX_INPUT = 600;
export const LOCAL_MODES = Object.freeze({
  general:"Give helpful, clear, short responses and acknowledge uncertainty.",
  learning:"Teach patiently in steps with concrete examples; check assumptions.",
  code:"Help with programming and debugging; explain security implications and test assumptions.",
  hope:"Help draft realistic, compassionate volunteering and community-impact plans without inventing donations or registered organizations."
});
const SYSTEM = "You are HopeAI Local, a compact experimental language model in the SKYCOIN4444 engineering beta. You run on the user's device. You cannot browse, use tools, take actions, remember previous sessions, access accounts, or perform financial transactions. Never claim you did any such thing. Do not fabricate facts; express uncertainty. For emergencies, encourage real-world help rather than pretending to provide urgent services.";
export function resolveLocalModel(kind = "quick") {
  if (!Object.hasOwn(LOCAL_MODELS,kind)) throw new RangeError("Unsupported local model");
  return LOCAL_MODELS[kind];
}
export function buildLocalMessages(raw, history = [], mode = "general") {
  if (typeof raw !== "string" || !raw.trim() || raw.length > MAX_INPUT)
    throw new RangeError("Message must contain 1 to 600 characters");
  if (!Object.hasOwn(LOCAL_MODES,mode)) throw new RangeError("Unsupported chat mode");
  if (!Array.isArray(history)) throw new TypeError("History must be an array");
  const prior = history.slice(-6);
  if (prior.some(m => !m || typeof m !== "object" || Object.keys(m).sort().join(",") !== "content,role" ||
    !["assistant","user"].includes(m.role) ||
    typeof m.content !== "string" || !m.content.trim() || m.content.length > MAX_INPUT))
    throw new TypeError("Invalid conversation history");
  return [
    {role:"system",content:SYSTEM + " " + LOCAL_MODES[mode]},
    ...prior.map(m => ({role:m.role,content:m.content})),
    {role:"user",content:raw.trim()}
  ];
}
export function extractLocalAnswer(result) {
  const generated = result?.[0]?.generated_text;
  let answer = "";
  if (Array.isArray(generated)) {
    answer = [...generated].reverse().find(m => m.role === "assistant")?.content || "";
  } else if (typeof generated === "string") answer = generated.trim();
  if (typeof answer !== "string" || !answer.trim())
    throw new Error("The local model did not generate readable text");
  return answer.trim().slice(0, 4000);
}
export function exportLocalTranscript(turns,model="quick") {
  resolveLocalModel(model);
  if (!Array.isArray(turns) || turns.length > 300 ||
      turns.some(t => !t || !["user","assistant"].includes(t.role) ||
      typeof t.content !== "string" || t.content.length > 4000)) {
    throw new TypeError("Invalid chat history export");
  }
  const header = ["HopeAI Local — conversation export",
    "Generated in your web browser using " + resolveLocalModel(model).id,
    "Saved at " + new Date().toISOString(),
    "AI can make mistakes. No chat data is stored by HopeAI servers.",""];
  const transcript = turns.flatMap(t => [
    t.role === "user" ? "YOU:" : "HOPEAI:",
    t.content,
    ""
  ]);
  return [...header,...transcript].join("\n");
}
