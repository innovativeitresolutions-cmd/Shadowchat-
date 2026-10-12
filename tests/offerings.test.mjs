import test from "node:test";
import assert from "node:assert/strict";
import {
  createTokenBlueprint, createOfferingDraft, assessOffering,
  createTokenDiscussion, normalizeLaunchpad, TOKEN_NETWORKS
} from "../public/offerings.mjs";
import { renderLaunchpad } from "../public/launchpad-ui.mjs";

const blueprint = () => createTokenBlueprint({
  name: "Community Learning", symbol: "LEARN", chain: "base",
  supply: "1000000000", decimals: "9", utility: "Optional non-financial community access"
}, "token-1", "2026-10-12T00:00:00.000Z");
const offering = (kind = "ICO", tokenId = "token-1") => ({
  kind, issuer: "Example Research Cooperative", title: "Internal preparation workspace",
  tokenId, purpose: "Build educational software and publish a transparent technical roadmap.",
  risks: "Technical uncertainty, legal restrictions, potential total loss and no liquidity."
});

test("token blueprint is a deterministic, non-deployed concept", () => {
  const token = blueprint();
  assert.equal(token.name, "Community Learning");
  assert.equal(token.symbol, "LEARN");
  assert.equal(token.supply, "1000000000");
  assert.equal(token.decimals, 9);
  assert.equal(token.deployed, false);
  assert.equal(token.contractAddress, null);
  assert.equal(token.transactionsEnabled, false);
  assert.equal(token.mintingEnabled, false);
});
test("invalid ticker, network, decimal, supply and missing utility fail closed", () => {
  const base = { name: "Test coin", symbol: "TEST", chain: "base", supply: "10", decimals: 9, utility: "study" };
  for (const patch of [
    { symbol: "x" }, { symbol: "x-y" }, { chain: "unknown" },
    { decimals: 19 }, { decimals: 0.5 }, { supply: "0" },
    { supply: "-10" }, { supply: "1.5" }, { supply: "1e9" },
    { supply: "9".repeat(31) }, { utility: "" }
  ]) assert.throws(() => createTokenBlueprint({ ...base, ...patch }, "token-2"));
  assert.ok(TOKEN_NETWORKS.includes("solana"));
});
test("ICO workspaces require an existing token design", () => {
  const token = blueprint();
  assert.throws(() => createOfferingDraft(offering(), [], "sale-1"), /Choose a saved/);
  const result = createOfferingDraft(offering(), [token], "sale-1");
  assert.equal(result.kind, "ICO");
  assert.equal(result.tokenId, "token-1");
  assert.equal(result.status, "internal-draft");
  assert.equal(result.acceptsFunds, false);
  assert.equal(result.acceptsSubscriptions, false);
  assert.equal(result.investmentExecution, false);
  assert.equal(result.registration, "not-verified");
});
test("company equity IPOs do not masquerade as token-sale ICOs", () => {
  const token = blueprint();
  assert.throws(() => createOfferingDraft(offering("IPO"), [token], "offer-2"), /distinct from token/);
  const ipo = createOfferingDraft(offering("IPO", null), [], "offer-2");
  assert.equal(ipo.kind, "IPO");
  assert.equal(ipo.tokenId, null);
  assert.equal(ipo.legalClearance, false);
  assert.throws(() => createOfferingDraft(offering("STO"), [token], "offer-3"), /ICO or IPO/);
});
test("review assessment never treats self-declared filings or approvals as verified", () => {
  const token = blueprint();
  const draft = createOfferingDraft(offering(), [token], "sale-1");
  const review = assessOffering({
    ...draft, registration: "approved", legalClearance: true,
    filingVerified: true, acceptsFunds: true, investmentExecution: true
  }, [token]);
  assert.equal(review.canAcceptInvestment, false);
  assert.equal(review.canPublishInvestmentOffer, false);
  assert.equal(review.canExecuteTokenMint, false);
  assert.equal(review.readiness, "blocked-pending-external-review");
  assert.ok(review.checks.some((check) => !check.satisfied));
});
test("token discussion blocks investment guarantees and key solicitations", () => {
  const token = blueprint();
  assert.throws(() => createTokenDiscussion({ tokenId: "bad", alias: "Member", message: "What utility?" }, [token], "x"));
  for (const message of [
    "guaranteed profits", "SEC approved", "Send your seed phrase",
    "send crypto to my wallet now", "risk-free returns"
  ]) {
    assert.throws(() => createTokenDiscussion({ tokenId: "token-1", alias: "Member", message }, [token], "x"), /blocked/i);
  }
  const note = createTokenDiscussion({ tokenId: "token-1", alias: "Member", message: "What audit criteria apply?" }, [token], "chat-1");
  assert.equal(note.deliveredToOthers, false);
  assert.equal(note.visibility, "browser-local-only");
});
test("tampered browser state cannot import live sale, deployed token, fake custody", () => {
  const token = { ...blueprint(), deployed: true, contractAddress: "0x1234", mintingEnabled: true, lifecycle: "live" };
  const rawOffer = { ...offering(), id: "offer-1", status: "approved", acceptsFunds: true, legalClearance: true };
  const imported = normalizeLaunchpad({
    tokens: [token], offerings: [rawOffer],
    messages: [{ tokenId: "token-1", id: "msg-1", alias: "a", message: "General question", deliveredToOthers: true }]
  });
  assert.equal(imported.tokens[0].deployed, false);
  assert.equal(imported.tokens[0].contractAddress, null);
  assert.equal(imported.offerings[0].acceptsFunds, false);
  assert.equal(imported.offerings[0].legalClearance, false);
  assert.equal(imported.messages[0].deliveredToOthers, false);
});
test("UI escapes untrusted drafts and shows blocked controls, not purchase buttons", () => {
  const token = blueprint();
  const offer = createOfferingDraft(offering(), [token], "offer-1");
  const html = renderLaunchpad({ launchpad: { tokens: [token], offerings: [offer], messages: [
    createTokenDiscussion({ tokenId: token.id, alias: "<img src=x>", message: "Question about code" }, [token], "m1")
  ] } });
  assert.match(html, /ICO \/ IPO/);
  assert.match(html, /fundraising disabled/);
  assert.match(html, /not deployed/);
  assert.match(html, /&lt;img src=x&gt;/);
  assert.doesNotMatch(html, /<img src=x>/);
  assert.doesNotMatch(html, />Invest now</i);
});
