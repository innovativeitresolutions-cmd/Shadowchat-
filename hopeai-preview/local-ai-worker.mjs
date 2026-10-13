/**
 * Genuine, opt-in browser inference. The selected ONNX model runs in this worker.
 * No user chat messages are sent to the Render server or an API provider.
 */
import {resolveLocalModel,buildLocalMessages,extractLocalAnswer} from "./local-ai-core.mjs";
let generatorPromise = null;
let initialized = false;
let selectedModel = null;
let runtime = null;
function report(message,id) { self.postMessage({type:"status",id,message}); }

async function prepare(kind,preferGpu,id) {
  const model = resolveLocalModel(kind);
  if (generatorPromise) {
    if (selectedModel !== kind) throw new Error("Stop this session before switching models");
    return generatorPromise;
  }
  selectedModel = kind;
  generatorPromise = (async () => {
    report("Loading browser AI runtime…",id);
    runtime = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/+esm");
    const {pipeline,env} = runtime;
    env.allowLocalModels = false;
    env.allowRemoteModels = true;
    env.useBrowserCache = true;
    if (env.backends?.onnx?.wasm) env.backends.onnx.wasm.numThreads = 1;
    const onProgress = info => {
      if (info.status === "progress" && Number.isFinite(info.progress)) {
        report("Downloading model file: " + Math.max(0,Math.min(100,Math.round(info.progress))) + "%",id);
      } else if (["download","initiate"].includes(info.status)) {
        report("Downloading " + model.label + " files (approx. " + model.size + " for the main model)…",id);
      }
    };
    if (preferGpu && "gpu" in navigator) {
      try {
        report("Trying experimental GPU acceleration…",id);
        const pipe = await pipeline("text-generation",model.id,{
          dtype:"q4f16",device:"webgpu",progress_callback:onProgress
        });
        report("Model ready with WebGPU. Start chatting!",id);
        return pipe;
      } catch {
        report("GPU unavailable; retrying with CPU. Please wait…",id);
      }
    }
    const pipe = await pipeline("text-generation",model.id,{
      dtype:"q4",device:"wasm",progress_callback:onProgress
    });
    report("Model ready on CPU. This device may generate slowly.",id);
    return pipe;
  })();
  try { return await generatorPromise; }
  catch (e) {
    generatorPromise = null;
    selectedModel = null;
    throw e;
  }
}
self.addEventListener("message", async event => {
  const {type,id,preferGpu,model="quick",message,history,mode="general"} = event.data || {};
  if (!["start","generate"].includes(type) || !Number.isSafeInteger(id) || id < 1) return;
  try {
    // Validate before any provider/model downloads or prompt rendering.
    const payload = type === "generate" ? buildLocalMessages(message,history,mode) : null;
    const generator = await prepare(model,Boolean(preferGpu),id);
    if (!initialized) {
      initialized = true;
      self.postMessage({type:"ready",id,model:resolveLocalModel(model).id});
    }
    if (type === "start") return;
    report("Generating your answer locally…",id);
    // Streaming conveys real output incrementally; final verified text is authoritative.
    const {TextStreamer} = runtime;
    const streamer = new TextStreamer(generator.tokenizer,{
      skip_prompt:true,skip_special_tokens:true,
      callback_function: (part) => {
        if (typeof part === "string" && part) self.postMessage({type:"delta",id,text:part});
      }
    });
    const result = await generator(payload,{
      max_new_tokens:model === "capable" ? 192 : 144,
      do_sample:true,temperature:0.65,top_k:40,repetition_penalty:1.15,
      streamer
    });
    self.postMessage({type:"reply",id,text:extractLocalAnswer(result)});
  } catch(error) {
    // Exceptions stay inside the user's browser; no server-side prompt logging.
    const description=(typeof error?.message==="string"?error.message:"Local model failed").slice(0,180);
    self.postMessage({type:"error",id,description});
  }
});
