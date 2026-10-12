import {
  TOKEN_NETWORKS, createTokenBlueprint, createOfferingDraft,
  createTokenDiscussion, assessOffering, normalizeLaunchpad
} from "./offerings.mjs";

const plain = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[c]));
const timestamp = () => new Date().toISOString();
const selectTokens = (items) => items.map((t) =>
  '<option value="' + plain(t.id) + '">' + plain(t.symbol + " · " + t.name) + "</option>").join("");
const empty = (text) => '<div class="empty">' + plain(text) + "</div>";

export function renderLaunchpad(state) {
  const data = normalizeLaunchpad(state.launchpad);
  const tokenOptions = selectTokens(data.tokens);
  const tokens = data.tokens.map((t) =>
    '<article class="item"><strong>' + plain(t.symbol) + " · " + plain(t.name) +
    "</strong><p>" + plain(t.chain) + " · " + plain(t.supply) +
    " planned tokens · " + t.decimals + " decimals</p><p>" + plain(t.utility) +
    '</p><span class="pill">design only · not deployed</span></article>'
  ).join("");
  const offerings = data.offerings.map((o) => {
    const review = assessOffering(o, data.tokens);
    const checks = review.checks.map((c) => '<li><span class="' +
      (c.satisfied ? "good" : "bad") + '">' + (c.satisfied ? "Drafted" : "Unverified") +
      "</span> — " + plain(c.label) + "</li>").join("");
    return '<article class="item"><h3>' + plain(o.title) + ' <span class="pill">' +
      plain(o.kind) + "</span></h3><p><strong>Issuer:</strong> " + plain(o.issuer) +
      " · <strong>Status:</strong> internal draft, blocked pending external review</p><p><strong>Purpose:</strong> " +
      plain(o.purpose) + "</p><p><strong>Risks:</strong> " + plain(o.risks) +
      "</p><p><strong>Preparation checks:</strong> " + review.completed + "/" +
      review.total + " · fundraising disabled</p><ul>" + checks + "</ul></article>";
  }).join("");
  const messages = data.messages.slice().reverse().map((m) => {
    const t = data.tokens.find((x) => x.id === m.tokenId);
    return '<article class="item"><strong>' + plain(m.alias) + '</strong> <span class="pill">' +
      plain(t?.symbol || "token") + " · local only</span><p>" + plain(m.message) + "</p></article>";
  }).join("");
  return [
    '<section class="hero-card"><div class="eyebrow">CryptoChat · project design studio</div>',
    "<h1>Token concepts &amp; ICO / IPO workspaces</h1>",
    "<p>Draft a cryptocurrency specification, prepare a disclosure checklist, and discuss designs locally. A token ICO is not a company equity IPO.</p></section>",
    '<div class="notice danger" role="status"><strong>Engineering beta — no securities offering.</strong> ',
    "These are browser-local internal planning records, not available investments. No token minting, blockchain deployment, subscriptions, broker services, payments, share issuance, regulatory approval, or investment execution. Never submit a seed phrase, private key, or money here.</div>",
    '<section class="grid two" aria-label="Launchpad drafting tools">',
    '<form class="card launchpad-form" id="token-blueprint-form"><h2>1 · Cryptocurrency blueprint</h2>',
    "<p>Specify a prospective token. Saving does not create or deploy a cryptocurrency.</p>",
    '<label>Token name<input name="name" required maxlength="80" placeholder="Example Community Token"></label>',
    '<label>Ticker<input name="symbol" required maxlength="12" placeholder="EXAMPLE" pattern="[a-zA-Z][a-zA-Z0-9]{1,11}"></label>',
    '<label>Network concept<select name="chain">',
    TOKEN_NETWORKS.map((n) => '<option value="' + n + '">' + n + "</option>").join(""),
    "</select></label>",
    '<label>Planned whole-token supply<input name="supply" required inputmode="numeric" maxlength="30" pattern="[1-9][0-9]*" placeholder="1000000000"></label>',
    '<label>Decimals<input name="decimals" type="number" min="0" max="18" step="1" value="9" required></label>',
    '<label>Intended utility<textarea name="utility" required maxlength="1000" placeholder="Explain the practical purpose, without investment promises."></textarea></label>',
    '<button type="submit" class="btn primary">Save local token design</button><p class="bad" role="alert" id="token-error"></p></form>',
    '<form class="card launchpad-form" id="offering-draft-form"><h2>2 · Offering preparation</h2>',
    "<p>An ICO may involve crypto assets or investment contracts. An IPO concerns company securities.</p>",
    '<label>Offering category<select name="kind"><option value="ICO">ICO · token offering concept</option><option value="IPO">IPO · company shares concept</option></select></label>',
    '<label>Issuer / company<input name="issuer" maxlength="120" required></label>',
    '<label>Workspace title<input name="title" maxlength="120" required></label>',
    '<label>Token blueprint (required for ICO)<select name="tokenId"><option value="">Select a design</option>',
    tokenOptions, "</select></label>",
    '<label>Project purpose / use of proceeds<textarea name="purpose" maxlength="1200" required></textarea></label>',
    '<label>Known risks<textarea name="risks" maxlength="2000" required placeholder="Include uncertainty, loss, operational and regulatory risks."></textarea></label>',
    '<button class="btn primary" type="submit">Save internal offering draft</button>',
    '<p class="bad" role="alert" id="offering-error"></p></form></section>',
    '<section class="card"><h2>Token design registry · ', String(data.tokens.length), "</h2>",
    "<p>No listed blueprint has a verified contract address, deployed token, sale price, or live supply.</p>",
    tokens || empty("No token designs created yet."), "</section>",
    '<section class="card"><h2>Offering workspaces · ', String(data.offerings.length), "</h2>",
    offerings || empty("No local offering workspaces yet. ICO and IPO issuance cannot be initiated here."),
    "</section>",
    '<section class="grid two" aria-label="CryptoChat token discussion">',
    '<form id="token-discussion-form" class="card launchpad-form"><h2>3 · CryptoChat discussion</h2>',
    "<p>Local notes for a token concept. No remote users, real-time messaging, investor solicitation, or financial advice.</p>",
    '<label>Token design<select name="tokenId" required><option value="">Choose design</option>',
    tokenOptions, "</select></label>",
    '<label>Display name<input name="alias" required maxlength="40" autocomplete="off"></label>',
    '<label>Discussion note<textarea name="message" required maxlength="500" placeholder="Ask about the project technical design or risks."></textarea></label>',
    '<button class="btn primary" type="submit">Save discussion note locally</button>',
    '<p class="bad" role="alert" id="discussion-error"></p></form>',
    '<div class="card"><h2>Discussion notes · ', String(data.messages.length), "</h2>",
    messages || empty("No notes. This is not a networked chat."),
    "</div></section>"
  ].join("");
}

export function bindLaunchpad({ state, save, render, uid }) {
  const data = () => normalizeLaunchpad(state.launchpad);
  const attach = (id, errId, build, bucket, max) => {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const error = document.getElementById(errId);
      if (error) error.textContent = "";
      try {
        const current = data();
        if (current[bucket].length >= max) throw new Error("Local workspace limit reached. Export or clear beta data.");
        const fields = Object.fromEntries(new FormData(form));
        const item = build(fields, current, uid(), timestamp());
        current[bucket].push(item);
        state.launchpad = current;
        save();
        render();
      } catch (e) {
        if (error) error.textContent = e instanceof Error ? e.message : "Unable to save this draft.";
      }
    });
  };
  attach("token-blueprint-form", "token-error",
    (input, _current, id, time) => createTokenBlueprint(input, id, time), "tokens", 40);
  attach("offering-draft-form", "offering-error",
    (input, current, id, time) => createOfferingDraft(
      { ...input, tokenId: input.kind === "IPO" ? null : input.tokenId },
      current.tokens, id, time
    ), "offerings", 40);
  attach("token-discussion-form", "discussion-error",
    (input, current, id, time) => createTokenDiscussion(input, current.tokens, id, time),
    "messages", 100);
}
