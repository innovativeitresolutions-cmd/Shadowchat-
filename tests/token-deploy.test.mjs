import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createTokenBlueprint } from "../public/offerings.mjs";
import { encodeTokenConstructor, renderTokenDeployment } from "../public/token-deploy-ui.mjs";

const token = createTokenBlueprint({
  name: "Example Test Token", symbol: "ETEST", chain: "ethereum",
  supply: "123456789", decimals: 6, utility: "Testing contract issuance on Sepolia only."
}, "sample", "2026-10-12");

test("Solidity deployment constructor uses canonical ABI offsets, supply and decimals", () => {
  const encoded = encodeTokenConstructor(token);
  const words = [0,1,2,3].map((i) => BigInt("0x" + encoded.slice(i * 64, (i+1)*64)));
  assert.equal(words[0], 128n);
  assert.equal(words[1], 192n); // first string: length + 32 bytes padded = 64 bytes
  assert.equal(words[2], 6n);
  assert.equal(words[3], 123456789n);
  const tail = encoded.slice(4 * 64);
  assert.equal(BigInt("0x" + tail.slice(0,64)), 18n); // "Example Test Token" length = 18
  assert.equal(BigInt("0x" + tail.slice(128, 192)), 5n); // "ETEST" length
});
test("rejects imported malformed token and renders testnet-only self-custody disclosure", () => {
  assert.throws(() => encodeTokenConstructor({ ...token, supply:"1e9" }));
  assert.throws(() => encodeTokenConstructor({ ...token, symbol:"<BAD>" }));
  const html = renderTokenDeployment({ launchpad: { tokens: [token] }, testnetDeployments: [
    { contractAddress:"<script>", txHash:"invalid" }
  ] });
  assert.match(html, /Ethereum Sepolia/);
  assert.match(html, /NOT independently audited/);
  assert.match(html, /TESTNET token/);
  assert.doesNotMatch(html, /<script>/);
});
test("checked-in compiler artifact is restricted to Sepolia and contains actual creation bytecode", () => {
  const artifact = JSON.parse(fs.readFileSync(new URL("../public/erc20-sepolia-artifact.json", import.meta.url)));
  assert.equal(artifact.chainId, 11155111);
  assert.equal(artifact.audited, false);
  assert.match(artifact.bytecode, /^0x[0-9a-fA-F]{200,}$/);
  assert.ok(artifact.abi.some((x) => x.type === "constructor"));
  assert.ok(artifact.abi.some((x) => x.name === "transfer"));
  assert.ok(artifact.abi.some((x) => x.name === "totalSupply"));
});
