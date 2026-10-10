import test from "node:test";
import assert from "node:assert/strict";
import { server } from "../server.mjs";

test("live HTTP server serves HopeAI and Impact browser modules with JavaScript MIME", async (t) => {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(async () => {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });
  const { port } = server.address();
  const base = "http://127.0.0.1:" + port;

  for (const name of ["app.js", "workflows.mjs", "workspaces-ui.mjs"]) {
    const response = await fetch(base + "/" + name);
    assert.equal(response.status, 200, name);
    assert.match(response.headers.get("content-type") || "", /text\/javascript/, name);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    const body = await response.text();
    assert.ok(body.length > 100, name + " is available to real browsers");
  }

  const health = await fetch(base + "/api/healthz");
  assert.equal(health.status, 200);
  const payload = await health.json();
  assert.equal(payload.release, "engineering-beta");
  assert.equal(payload.persistence, "browser-local-only");
  assert.equal(payload.productionReady, false);
});
