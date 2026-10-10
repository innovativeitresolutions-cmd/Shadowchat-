# SKYCOIN4444 / ShadowChat — Quality-First Engineering Beta

This repository is the clean, testable product-quality baseline for the SKYCOIN4444 / ShadowChat ecosystem. It deliberately favors **usable flagship journeys, explicit degraded states, deterministic tests, mobile/accessibility basics, privacy boundaries, and truthful capability labels** over raw screen count.

> **Release status: engineering beta.** This repository does **not** establish production readiness, live AI-provider connectivity, real donations/payments, charity verification, identity verification, custody, blockchain execution, regulated gambling, accreditation, compliance certification, or security certification.

## What works in this baseline

| Area | Implemented | Important boundary |
|---|---|---|
| HopeAI | Goal-specific, browser-local action plans, task completion, progress tracking, delete | Deterministic templates; no connected model/provider |
| HopeAI Impact | Campaign action boards, volunteer tasks, progress and HopeAI handoff | No donation, settlement, nonprofit verification, receipt, or tax determination |
| Navigation | Desktop + mobile navigation across all flagship areas | Designed as one coherent product shell |
| Social | Browser-local posts and reactions | No fake remote audience, realtime delivery, follower counts, or production moderation claim |
| Marketplace | Search, lawful listings, restricted-item moderation, seller trust signals, cart, order drafts | No payment, escrow, seller-ID verification, crypto settlement, shipment or payout |
| Games | Deterministic High/Low demo with resettable credits | Credits are non-redeemable; not gambling or financial wagering |
| Education | Skill check, scoring, targeted missed-topic review into HopeAI | Study aid only; no accreditation or professional credential |
| Wallet / Crypto | Watch-only public addresses and capability matrix | No private keys, signing, broadcasting, staking, mining, NFT minting, custody or live chain claim |
| Security | CSP/security headers, local-data export/wipe, explicit boundaries | Not a security/compliance certification |
| Release Ops | Health/capability/release-gate endpoints and P1 matrix | Hosted persistence/recovery/telemetry evidence still required |

## Run it

Requires Node.js 20+ and no third-party runtime dependencies.

```bash
npm start
```

Open `http://localhost:3000`.

## Verify it

```bash
npm run check
npm test
npm run verify
```

The suite validates marketplace restrictions, trust scoring, order-state rules, HopeAI/Impact truthfulness, education scoring, non-financial game behavior, watch-only address validation, and the release-gate default of **not production ready**.

## Architecture

```text
public/
  index.html      accessible application entry
  app.js          flagship product flows + browser-local state
  styles.css      responsive/mobile-first UI
src/
  domain.mjs      deterministic domain logic and capability boundaries
server.mjs        dependency-free static/API server with security headers
tests/
  domain.test.mjs deterministic Node test suite
docs/
  CRYPTO_BOUNDARIES.md
  LEGACY_IMPORT_STATUS.md
scripts/
  verify-release.mjs
```

### Persistence

This baseline intentionally uses browser `localStorage` for demo state so its persistence boundary is obvious. It is **not** a substitute for durable multi-user server/database persistence. A production candidate would require authenticated user-scoped database storage, migrations, backup/restore drills, retention/deletion policy, concurrency handling, monitoring, and tested recovery.

### External dependencies

The baseline fails closed rather than fabricating success. No external model provider, payment processor, blockchain RPC, custody service, charity-verification provider, email/SMS provider, identity provider, or telemetry backend is required to run the local product.

Future provider integrations should be added behind explicit capability checks and should surface loading, unavailable, timeout, retry, authorization, and partial-failure states.

## HopeAI

HopeAI is the single public Hope brand. The current local helper creates a deterministic four-step action plan for a selected goal type and explicitly labels itself as **not a connected AI provider response**. Plans support step completion and progress tracking. Browser-local drafts can be cleared from the HopeAI or Security surfaces.

A real provider connection should not be marked live until there is configured secret management, request authorization, rate limiting, timeout/cancellation, provider-error redaction, token/cost controls, abuse handling, observability, data-retention documentation, and tests proving degraded behavior when the provider is unavailable.

## HopeAI Impact / charity

Impact supports planning only: campaign goal, volunteer/planning actions, progress tracking, and pledge intent. The pledge value is metadata. `moneyMoved` and `charityVerified` remain false.

A real donation workflow would require, at minimum, a verified payment provider, account/merchant configuration, authorization and webhook integrity, idempotency, receipts/refunds, ledger reconciliation, dispute handling, charity/nonprofit verification appropriate to the product, data retention, security review, and legal/compliance analysis. None of those are implied by this repository.

See [HopeAI & Impact action workspaces](docs/HOPEAI_IMPACT_WORKSPACES.md) for step-by-step usage, tests, and boundaries.

## Social / ShadowChat

The Social area provides a small, honest local feed. Posts and reactions persist in the current browser only. There are no fabricated users, engagement counters, follower networks, remote delivery receipts, or realtime claims.

The next server-backed milestone should use participant authorization, durable user-scoped storage, rate limits, moderation/reporting, privacy controls, message/post deletion semantics, abuse logging, and clear delivery/error states.

## Marketplace

The marketplace is intentionally **lawful and safety-first**. Its local moderation rejects common controlled-substance, weapon, stolen-credential/goods, malware, forged-ID, and counterfeit-currency terms. The filter is only a first-line engineering control, not a complete moderation/compliance system.

Seller trust is a deterministic beta score based on rating, order history, account age inputs, and dispute penalties. It is not identity verification or a guarantee.

Orders are drafts with `financialExecution: false` and `settlement: "none"`. The app never claims live escrow, verified sellers, smart-contract settlement, or buyer-protection guarantees.

## Games

The demo game intentionally uses deterministic local output rather than claiming cryptographic randomness. Credits reset to 1,000 and have no redeemable value. The product has no deposits, withdrawals, prizes, tokens, cashouts, custody, or regulated-wagering functionality.

## Education / SkySchool

SkySchool includes a small security/crypto skill check and targeted review routing into HopeAI. Results are browser-local study records. They are not accreditation, academic credit, professional licensure, employment qualification, or an externally recognized certificate.

## Crypto / Web3 — detailed status

See [`docs/CRYPTO_BOUNDARIES.md`](docs/CRYPTO_BOUNDARIES.md) for the full evidence boundary. In short:

- EVM + Solana **public address** format validation is implemented for watch-only use.
- The app intentionally never asks for a seed phrase or private key.
- No transaction signing/broadcasting is implemented.
- No live balance/RPC guarantee is made.
- No swap/DEX execution is implemented.
- No staking validator/pool execution is implemented.
- No mining network execution is implemented.
- No NFT contract deployment/minting is implemented.
- No token contract deployment is proven.
- Historical SKY4/SKY444 naming and economic constants conflict, so this repository does not publish a canonical live token supply/yield claim.
- Historical server-derived HD-wallet code is treated as a custody/key-management risk rather than “non-custodial.”

## Security posture

`server.mjs` sets:

- Content Security Policy;
- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- strict referrer policy;
- a restrictive permissions policy;
- no-store cache behavior for this beta server.

These controls are useful but **not a security certification**. A hosted production candidate still needs dependency scanning, secret rotation, auth/session testing, database access controls, TLS verification, vulnerability management, incident response, logging/alerting, backup/restore evidence, and external review appropriate to risk.

## Major P1 release gates

The product itself shows these gates as unresolved until evidence exists:

1. invited-session persistence across restart/redeploy;
2. real database backup/restore with measured RPO/RTO;
3. load/resilience and dependency-failure baselines;
4. launch-critical cross-system integration under authenticated hosted conditions;
5. deployed telemetry/alerting with incident evidence.

Passing local tests does not automatically pass these infrastructure gates.

## Legacy source

The full recovered SKYCOIN4444 archive is preserved under `legacy-archive/` as quarantined historical source. GitHub Actions verified **1,754 / 1,754 inventory-file SHA-256 hashes**, **4 / 4 optimized deployment helpers**, **1,693 selected source files**, and **355,835 selected source LOC** against the recovered consolidation archive.

The archive is **not loaded by the active runtime** and is not evidence that historical provider, payment, crypto, security, deployment, compliance, charity, or production claims are live or verified. See [`docs/LEGACY_IMPORT_STATUS.md`](docs/LEGACY_IMPORT_STATUS.md) and [`legacy-archive/IMPORT_VERIFICATION.md`](legacy-archive/IMPORT_VERIFICATION.md).

## Product direction

The next upgrades should deepen the existing journeys rather than create broad new feature families:

- authenticated durable persistence;
- real database recovery evidence;
- safe HopeAI provider integration;
- authorized server-backed Social/ShadowChat transport;
- marketplace moderation/disputes without unsupported financial execution;
- richer deterministic games before any regulated-money consideration;
- deeper assessment/progress tracking for education;
- watch-only chain data before any signing/custody work;
- mobile/accessibility smoke coverage;
- deployed metrics, alert delivery and failure drills.

## License

BSD-2-Clause, matching the repository license unless a file says otherwise.
