import fs from "node:fs";
import path from "node:path";

const required = [
  "README.md", "server.mjs", "src/domain.mjs", "public/index.html", "public/app.js", "public/styles.css", "tests/domain.test.mjs", "docs/CRYPTO_BOUNDARIES.md", "docs/LEGACY_IMPORT_STATUS.md"
];
for (const file of required) {
  if (!fs.existsSync(path.resolve(file))) throw new Error(`Missing required release file: ${file}`);
}
const app = fs.readFileSync("public/app.js", "utf8");
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
