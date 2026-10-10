import fs from "node:fs";
import path from "node:path";

const required = [
  "README.md", "server.mjs", "src/domain.mjs", "public/index.html", "public/app.js", "public/styles.css", "tests/domain.test.mjs", "docs/CRYPTO_BOUNDARIES.md", "docs/LEGACY_IMPORT_STATUS.md", "public/workflows.mjs", "public/workspaces-ui.mjs", "docs/HOPEAI_IMPACT_WORKSPACES.md", "tests/workflows.test.mjs", "tests/http.test.mjs"
];
for (const file of required) {
  if (!fs.existsSync(path.resolve(file))) throw new Error(`Missing required release file: ${file}`);
}
const app = fs.readFileSync("public/app.js", "utf8");
if (!app.includes('import { enhanceWorkspaces } from "./workspaces-ui.mjs"') || !app.includes("enhanceWorkspaces(q,")) {
  throw new Error("Interactive workspaces are not wired into the running beta.");
}
if (!fs.readFileSync("server.mjs", "utf8").includes('".mjs": "text/javascript; charset=utf-8"')) {
  throw new Error("Browser modules are not served with a JavaScript MIME type.");
}
for (const area of ["HopeAI", "Impact", "Social", "Marketplace", "Games", "Education", "Wallet / Crypto", "Security", "Release Ops"]) {
  if (!app.includes(area)) throw new Error(`Missing flagship area in app surface: ${area}`);
}
const forbiddenPositiveClaims = [
  /(^|[^\w])100% secure([^\w]|$)/i,
  /(^|[^\w])guaranteed profit([^\w]|$)/i,
  /(^|[^\w])we are production certified([^\w]|$)/i,
  /(^|[^\w])verified charity payments([^\w]|$)/i,
  /(^|[^\w])regulated gambling platform([^\w]|$)/i,
];
const repoText = required.filter(f => fs.existsSync(f)).map(f => fs.readFileSync(f, "utf8")).join("\n");
for (const claim of forbiddenPositiveClaims) {
  if (claim.test(repoText)) throw new Error(`Forbidden unsupported positive claim found: ${claim}`);
}
console.log(`Release verification passed: ${required.length} required files, flagship surfaces present, unsupported-claim scan clean.`);
