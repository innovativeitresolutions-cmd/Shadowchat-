/** Experimental in-browser text generation, not hosted/provider OpenAI chat. */
import { LOCAL_MODEL_ID, buildLocalMessages, extractLocalAnswer } from "./local-ai-core.mjs";

let generatorPromise = null;
let initialized = false;
function report(message) { self.postMessage({type: "status", message}); }
async function prepare(preferGpu) {
  if (generatorPromise) return generatorPromise;
  generatorPromise = (async () => {
    report("Loading the local AI runtime from jsDelivr…");
    const {pipeline, env} = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm");
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.useBrowserCache = true;
    if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;
    const onProgress = info => {
      if (info.status === "progress" && Number.isFinite(info.progress)) {
        report("Downloading the model: " + Math.max(0, Math.min(100, Math.round(info.progress))) + "%");
      } else if (info.status === "initiate" || info.status === "download") {
        report("Downloading local AI weights and tokenizer. This may take several minutes…");
      }
    };
    if (preferGpu && "gpu" in navigator) {
      try {
        report("Attempting experimental GPU acceleration…");
        const pipe = await pipeline("text-generation", LOCAL_MODEL_ID, {
          dtype: "q4f16", device: "webgpu", progress_callback: onProgress
        });
        report("Local AI ready (WebGPU). No AI API credits required.");
        return pipe;
      } catch {
        report("GPU unavailable or unsupported. Trying CPU/WASM instead…");
      }
    }
    const pipe = await pipeline("text-generation", LOCAL_MODEL_ID, {
      dtype: "q4", device: "wasm", progress_callback: onProgress
    });
    report("Local AI ready (CPU/WASM). Responses may take time.");
    return pipe;
  })();
  try {
    return await generatorPromise;
  } catch (err) {
    generatorPromise = null;
    throw err;
  }
}
self.addEventListener("message", async event => {
  const {type, id, preferGpu, message, history} = event.data || {};
  if (type !== "start" && type !== "generate") return;
  if (!Number.isSafeInteger(id) || id < 1) return;
  try {
    const messages = type === "generate" ? buildLocalMessages(message, history) : null;
    const generator = await prepare(Boolean(preferGpu));
    if (!initialized) {
      initialized = true;
      self.postMessage({type:"ready",id,model:LOCAL_MODEL_ID});
    }
    if (type === "start") return;
    report("Generating a real response on your device…");
    const result = await generator(messages, {
      max_new_tokens: 128,
      do_sample: true,
      temperature: 0.7,
      top_k: 40,
      repetition_penalty: 1.12
    });
    self.postMessage({type: "reply",id, text:extractLocalAnswer(result)});
  } catch (error) {
    const description = (error && typeof error.message === "string" ? error.message : "").slice(0, 160);
    // The browser can see local runtime exceptions. This is never sent to the server.
    self.postMessage({type: "error",id, description: description || "Local model failed to load or generate."});
  }
});
