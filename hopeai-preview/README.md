# HopeAI Chat — isolated, device-powered engineering beta

**Live hosting:** https://hopeai-standalone-preview.onrender.com

This **is a real generative chatbot**, using open-weight SmolLM2 language models executed on the visitor's device with Transformers.js / ONNX Runtime Web. It is **not** a hosted paid-model service, a scripted imitation of AI, or the canonical private Python HopeAI application.

## Choose your model

| Option | Exact Hugging Face model | Main q4 ONNX weight | Evidence |
|---|---|---|---|
| Quick (default) | `onnx-community/SmolLM2-135M-Instruct-ONNX` | ~181 MB | Actual inference and two-turn browser test via CI |
| Stronger (experimental) | `onnx-community/SmolLM2-360M-Instruct-ONNX` | ~386 MB | Public model and ONNX files exist; no cross-device runtime guarantee |

The larger model can need substantially more RAM; experimental WebGPU mode uses different quantized weights and may be unsupported. Model runtime comes from the pinned CDN URL `@huggingface/transformers@3.8.1`; actual model artifacts are downloaded from Hugging Face. No data is sent to the HopeAI Render backend **by the local conversation code**. Initial model/runtime downloads access third-party services; do not enter secrets.

## Experience and limits

- Free-form multi-turn conversational text generation, real streamed answer display.
- Different system guidance for general chat, learning, coding, and community volunteering.
- New conversation without redownloading or reloading the selected model.
- Plain-text transcript export and full session unload.
- Strict user prompt and prior-turn validation; latest six messages are provided as a small context window, not persistent memory.
- User can stop inference by unloading the worker; session is deliberately not persisted.
- **No** browsing, up-to-date data, durable memory, medical/legal/financial certification, external API actions, real donations, accounts, or financial transactions.
- Small models hallucinate more than commercial large models. Browser and device hardware constrain speed and availability.
- The server-side authenticated OpenAI provider route separately remains fail-closed without a verified API provider. It must never simulate a generated answer.
- If an API key is shared in a chat, revoke it and replace it securely; the live Render environment must never be used as a key dump.

## Checks

```bash
node --check hopeai-preview/server.mjs
node --check hopeai-preview/local-ai-worker.mjs
node --check hopeai-preview/local-ai-ui.mjs
npm --prefix hopeai-preview test
```

The GitHub workflow `.github/workflows/hopeai-local-ai-e2e.yml` installs Chromium, **downloads the actual default model and generates real conversation**, checks multi-turn chat, export, session reset, and unload. This is not a mock model test. The unit suite separately stubs upstream API calls to verify server-side auth and CSRF without spending API credits.

Render service ID: `srv-db72ogaj9qps73b0oh30`; free Node.js web service with `node hopeai-preview/server.mjs` and `PORT=10000` in the separate public `innovativeitresolutions-cmd/Shadowchat-` repository, branch `deploy/hopeai-standalone-beta-20261013`. The parent repository's `main` and the private `innovativeitresolutions-cmd/ai` repository are distinct and must not be mistaken for deployed source.

## Integration boundary

All conversation prompts/responses run in the client web worker; Render serves only HTML, JS and CSS for on-device AI. For a production assistant with higher accuracy, cross-device persistence, team access or enterprise-grade safety, integrate a **separately provisioned** inference provider or hosting infrastructure with usage quotas, verified authorization, secure persistence, professional privacy/legal review, and end-to-end rollout testing.
