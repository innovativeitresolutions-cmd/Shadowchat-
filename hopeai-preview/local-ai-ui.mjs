/** Dedicated experimental, genuine on-device conversation UI. */
const element = id => document.getElementById(id);
const start = element("local-ai-start");
const stop = element("local-ai-stop");
const form = element("local-ai-form");
const status = element("local-ai-status");
const messages = element("local-ai-messages");
const prompt = element("local-ai-prompt");
const submit = element("local-ai-send");
let worker = null;
let ready = false;
let busy = false;
let sequence = 0;
let currentId = 0;
let turns = [];
function setStatus(text) { status.textContent = text; }
function append(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = "local-ai-message " + role;
  const heading = document.createElement("strong");
  heading.textContent = role === "user" ? "You" : "HopeAI Local · SmolLM2";
  const body = document.createElement("div");
  body.textContent = text;
  wrapper.append(heading,body);
  messages.append(wrapper);
  messages.scrollTop = messages.scrollHeight;
}
function resetSession() {
  if (worker) worker.terminate();
  worker = null;
  ready = false;
  busy = false;
  turns = [];
  messages.replaceChildren();
  sequence += 1;
  currentId = sequence;
  start.hidden = false;
  stop.hidden = true;
  start.disabled = false;
  submit.disabled = false;
  form.hidden = true;
  prompt.disabled = false;
  prompt.value = "";
  setStatus("Local AI stopped. Conversations were held in this tab only.");
}
function failure(message) {
  const explanation = "On-device AI could not start or finish: " + message +
    " Try a laptop, enable WebGPU, free device memory, or use the working planning tools above.";
  if (!ready) {
    resetSession();
    setStatus(explanation);
  } else {
    busy = false;
    submit.disabled = false;
    prompt.disabled = false;
    setStatus(explanation);
  }
}
start.addEventListener("click", () => {
  if (worker) return;
  let instance;
  try {
    instance = new Worker("/local-ai-worker.mjs", {type:"module", name:"hopeai-local-inference"});
  } catch {
    failure("This browser does not support the required module worker.");
    return;
  }
  worker = instance;
  ready = false;
  busy = true;
  const id = ++sequence;
  currentId = id;
  const preferGpu = element("local-ai-gpu").checked;
  start.disabled = true;
  stop.hidden = false;
  setStatus("Preparing on-device AI. You can stop at any time.");
  instance.onerror = () => {
    if (instance === worker) failure("Local model runtime failed to load.");
  };
  instance.onmessage = event => {
    if (instance !== worker) return;
    const data = event.data || {};
    if (data.type === "status") {
      setStatus(String(data.message || "").slice(0, 180));
      return;
    }
    if (data.id !== currentId) return;
    if (data.type === "ready") {
      ready = true; busy = false;
      form.hidden = false;
      start.hidden = true;
      prompt.focus();
      setStatus("Real on-device language model loaded. Type a message to chat.");
    } else if (data.type === "reply") {
      const latestUser = pendingMessage;
      if (!busy || !latestUser) return;
      const text = String(data.text || "").trim();
      if (!text) return failure("Empty model response.");
      append("user",latestUser);
      append("assistant",text);
      turns.push({role:"user",content:latestUser.slice(0,600)},
        {role:"assistant",content:text.slice(0,600)});
      busy = false;
      pendingMessage = "";
      submit.disabled = false; prompt.disabled = false;
      prompt.value = ""; prompt.focus();
      setStatus("Generated locally. Responses may be inaccurate; verify facts.");
    } else if (data.type === "error") {
      failure(String(data.description || "Model error.").slice(0,180));
    }
  };
  instance.postMessage({type:"start",id,preferGpu});
});
let pendingMessage = "";
form.addEventListener("submit", event => {
  event.preventDefault();
  if (!worker || !ready || busy) return;
  const text = prompt.value.trim();
  if (!text || text.length > 600) {setStatus("Enter a message up to 600 characters.");return;}
  busy = true;
  pendingMessage = text;
  const id = ++sequence;
  currentId = id;
  submit.disabled = true; prompt.disabled = true;
  setStatus("Your device is generating a new response. This may take a while…");
  worker.postMessage({type:"generate",id,message:text,
    history:turns.slice(-4).map(t => ({role:t.role,content:t.content.slice(0,600)}))});
});
stop.addEventListener("click", resetSession);
