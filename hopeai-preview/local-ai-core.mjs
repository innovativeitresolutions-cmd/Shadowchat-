/** Pure validation and response extraction for a real on-device generative model. */
export const LOCAL_MODEL_ID = "onnx-community/SmolLM2-135M-Instruct-ONNX";
export const MAX_INPUT = 600;
const SYSTEM = "You are HopeAI Local, a compact experimental on-device language model in the SKYCOIN4444 beta. Give concise factual answers and say when uncertain. You cannot browse, run tools, conduct financial transactions, access user accounts, or store messages. Do not claim any external actions or certified advice.";
export function buildLocalMessages(raw, history = []) {
  if (typeof raw !== "string" || !raw.trim() || raw.length > MAX_INPUT) {
    throw new RangeError("Message must contain 1 to 600 characters");
  }
  if (!Array.isArray(history)) throw new TypeError("History must be an array");
  const prior = history.slice(-4);
  if (prior.some(m => !m || !["assistant", "user"].includes(m.role) ||
    typeof m.content !== "string" || m.content.length > MAX_INPUT ||
    !m.content.trim())) throw new TypeError("Invalid conversation history");
  return [
    {role:"system",content:SYSTEM},
    ...prior.map(m => ({role:m.role,content:m.content})),
    {role:"user",content:raw.trim()}
  ];
}
export function extractLocalAnswer(result) {
  const generated = result?.[0]?.generated_text;
  let answer = "";
  if (Array.isArray(generated)) {
    answer = [...generated].reverse().find(m => m.role === "assistant")?.content || "";
  } else if (typeof generated === "string") {
    answer = generated.trim();
  }
  if (typeof answer !== "string" || !answer.trim())
    throw new Error("The local model did not generate readable text");
  return answer.trim().slice(0, 4000);
}
