import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CAPABILITIES, PRODUCT_AREAS, releaseGateSummary } from "./src/domain.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 3000);

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

function securityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  res.setHeader("Cache-Control", "no-store");
}

function json(res, status, body) {
  securityHeaders(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body, null, 2));
}

function serveFile(res, requestPath) {
  const normalized = path.normalize(requestPath).replace(/^([.][.][/\\])+/, "");
  const target = path.join(publicDir, normalized === "/" ? "index.html" : normalized);
  if (!target.startsWith(publicDir)) return json(res, 403, { error: "forbidden" });
  let finalTarget = target;
  if (!fs.existsSync(finalTarget) || fs.statSync(finalTarget).isDirectory()) finalTarget = path.join(publicDir, "index.html");
  securityHeaders(res);
  res.writeHead(200, { "Content-Type": mime[path.extname(finalTarget)] || "application/octet-stream" });
  fs.createReadStream(finalTarget).pipe(res);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/api/healthz") {
    return json(res, 200, {
      status: "ok",
      release: "engineering-beta",
      time: new Date().toISOString(),
      persistence: "browser-local-only",
      database: "not-configured",
      providerConnectivity: "not-verified",
      productionReady: false,
    });
  }
  if (url.pathname === "/api/capabilities") {
    return json(res, 200, { release: "engineering-beta", productAreas: PRODUCT_AREAS, capabilities: CAPABILITIES });
  }
  if (url.pathname === "/api/release-gates") {
    return json(res, 200, releaseGateSummary({}));
  }
  return serveFile(res, url.pathname);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`SKYCOIN4444 / ShadowChat engineering beta listening on http://0.0.0.0:${port}`);
});
