// CryptoChat offering workspaces — deterministic, browser-local, no securities sales or token deployment.
export const TOKEN_NETWORKS = Object.freeze(["ethereum", "base", "polygon", "bsc", "solana"]);
export const OFFERING_KINDS = Object.freeze(["ICO", "IPO"]);

function field(value, max, label) {
  if (typeof value !== "string") throw new Error(label + " is required.");
  const text = value.trim().replace(/\s+/g, " ");
  if (!text || text.length > max) throw new Error(label + " must be 1–" + max + " characters.");
  return text;
}
function identifier(value, label) {
  const id = field(value, 100, label);
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(id)) throw new Error("Invalid " + label + ".");
  return id;
}
function dateString(value) {
  // Dates are client-supplied metadata, never proof of an event or a legal filing.
  return typeof value === "string" ? value.slice(0, 35) : "";
}
export function createTokenBlueprint(input, id, createdAt = "") {
  if (!input || typeof input !== "object") throw new Error("Token design required.");
  const name = field(input.name, 80, "Token name");
  const symbol = field(input.symbol, 12, "Ticker").toUpperCase();
  if (!/^[A-Z][A-Z0-9]{1,11}$/.test(symbol)) throw new Error("Ticker must be 2–12 letters/numbers, starting with a letter.");
  const chain = field(input.chain, 30, "Network").toLowerCase();
  if (!TOKEN_NETWORKS.includes(chain)) throw new Error("Unsupported concept network.");
  const supply = field(input.supply, 40, "Planned supply");
  if (!/^[1-9]\d{0,29}$/.test(supply)) throw new Error("Supply must be a positive whole number with at most 30 digits.");
  const decimals = Number(input.decimals);
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) throw new Error("Decimals must be a whole number from 0 to 18.");
  const utility = field(input.utility, 1000, "Intended utility");
  return {
    id: identifier(id, "token ID"), name, symbol, chain, supply, decimals, utility,
    createdAt: dateString(createdAt),
    lifecycle: "design-only", deployed: false, contractAddress: null, mintingEnabled: false,
    transactionsEnabled: false, externalVerification: false
  };
}

export function createOfferingDraft(input, tokens, id, createdAt = "") {
  if (!input || typeof input !== "object") throw new Error("Offering information required.");
  const kind = field(input.kind, 3, "Offering type").toUpperCase();
  if (!OFFERING_KINDS.includes(kind)) throw new Error("Offering type must be ICO or IPO.");
  const issuer = field(input.issuer, 120, "Issuer");
  const title = field(input.title, 120, "Offering title");
  const purpose = field(input.purpose, 1200, "Project or use of proceeds");
  const risks = field(input.risks, 2000, "Risk disclosures");
  let tokenId = null;
  if (kind === "ICO") {
    tokenId = identifier(input.tokenId, "token ID");
    if (!Array.isArray(tokens) || !tokens.some((t) => t?.id === tokenId && t?.lifecycle === "design-only")) {
      throw new Error("Choose a saved token design for this ICO draft.");
    }
  }
  if (kind === "IPO" && input.tokenId) throw new Error("Company share IPOs are distinct from token sales.");
  return {
    id: identifier(id, "offering ID"), kind, issuer, title, purpose, risks, tokenId,
    createdAt: dateString(createdAt), status: "internal-draft",
    approval: "not-reviewed", registration: "not-verified", legalClearance: false,
    acceptsFunds: false, acceptsSubscriptions: false, investmentExecution: false
  };
}

export function assessOffering(draft, tokens = []) {
  const isDraft = draft?.kind === "ICO" || draft?.kind === "IPO";
  const checks = [
    { label: "Issuer and project stated", satisfied: Boolean(isDraft && draft.issuer && draft.title && draft.purpose) },
    { label: "Risks described (not independently reviewed)", satisfied: Boolean(isDraft && draft.risks && draft.risks.length >= 20) },
    { label: "Token design linked (ICO only)", satisfied: draft?.kind === "ICO" ? tokens.some((t) => t?.id === draft.tokenId) : true },
    { label: "Independent securities counsel review", satisfied: false },
    { label: "Registration/effective filing or valid exemption verified", satisfied: false },
    { label: "Identity/eligibility, AML and relevant jurisdiction checks verified", satisfied: false },
    { label: "Approved intermediaries, payment, custody and disclosures verified", satisfied: false }
  ];
  return {
    checks, completed: checks.filter((c) => c.satisfied).length, total: checks.length,
    readiness: "blocked-pending-external-review", canAcceptInvestment: false,
    canExecuteTokenMint: false, canPublishInvestmentOffer: false
  };
}

const disallowed = [
  /\b(?:guaranteed|risk[\s-]?free)\s+(?:returns?|profits?|gains?|income)\b/i,
  /\b(?:sec|government|regulator)[\s-]+(?:approved|certified|guaranteed)\b/i,
  /\b(?:send|share|post)\s+(?:me\s+)?(?:your\s+)?(?:seed phrase|private key|mnemonic)\b/i,
  /\b(?:send|wire|transfer)\s+(?:funds|crypto|money)\s+(?:to|now)\b/i
];
export function createTokenDiscussion(input, tokens, id, createdAt = "") {
  if (!input || typeof input !== "object") throw new Error("Discussion required.");
  const tokenId = identifier(input.tokenId, "token ID");
  if (!Array.isArray(tokens) || !tokens.some((t) => t?.id === tokenId)) throw new Error("Choose a saved token design.");
  const alias = field(input.alias, 40, "Display name");
  const message = field(input.message, 500, "Message");
  if (disallowed.some((pattern) => pattern.test(message))) throw new Error("Message blocked: misleading investment or sensitive-key solicitation.");
  return {
    id: identifier(id, "message ID"), tokenId, alias, message,
    createdAt: dateString(createdAt), visibility: "browser-local-only", deliveredToOthers: false
  };
}

export function normalizeLaunchpad(raw) {
  // Untrusted browser storage never authorizes sales or creates fake deployed tokens.
  const input = raw && typeof raw === "object" ? raw : {};
  return {
    tokens: (Array.isArray(input.tokens) ? input.tokens : []).slice(0, 40).flatMap((x) => {
      try { return [createTokenBlueprint(x, x.id, x.createdAt)]; } catch { return []; }
    }),
    offerings: (Array.isArray(input.offerings) ? input.offerings : []).slice(0, 40).flatMap((x) => {
      try { return [createOfferingDraft(x, (Array.isArray(input.tokens) ? input.tokens : []).map((t) => ({ ...t, lifecycle: "design-only" })), x.id, x.createdAt)]; } catch { return []; }
    }),
    messages: (Array.isArray(input.messages) ? input.messages : []).slice(0, 100).flatMap((x) => {
      try { return [createTokenDiscussion(x, Array.isArray(input.tokens) ? input.tokens : [], x.id, x.createdAt)]; } catch { return []; }
    })
  };
}
