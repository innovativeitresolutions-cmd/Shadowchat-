# SKYCOIN4444 — Unified Super-App Launch Contract

Status: execution baseline on `launch/super-app-unification`. This document is an implementation contract, not a claim that every feature is already live.

## Product promise
One mobile-first destination with one account, one navigation system, shared profiles/notifications/search, and consistent privacy and safety controls. The goal is a fun, useful place to spend time: discover, talk, learn, create, play, shop, and explore Web3. Never label a demo as a live financial or social service.

## Product areas (all retained in the unified shell)
1. Home / personalized dashboard
2. HopeAI conversational assistant
3. AI agents and workflows
4. SkySocial feed, profiles, follows, comments, reactions, media
5. ShadowChat direct/group messaging
6. Voice and video calling
7. SkyLive streaming and creator channels
8. Creator Studio
9. SkyMarket listings and discovery
10. SkyShop cart, orders and seller tools
11. SkyWallet (non-custodial connection; never collect seed phrases)
12. SkyExchange (market data and explicitly gated execution)
13. Portfolio tracker
14. Paper trading / day-trading simulator
15. Payments and membership checkout
16. NFT gallery, metadata and testnet minting
17. SkySchool courses and progress
18. Tutoring
19. Language exchange (HelloTalk-style matching and conversation practice)
20. SkyHope campaigns and impact tracking
21. Volunteer network and events
22. SkyGaming arcade
23. Chess, tournaments and leaderboards
24. Casual chance games (free, non-redeemable demo credits only until legal review)
25. SkyDating (adults-only, consent, privacy and safety gates)
26. SkyCloud user files and app services
27. SkyDeveloper APIs, docs and sandbox
28. SkySecurity and account privacy
29. SkyAnalytics and creator/business insights
30. SkyEnterprise, SkyInvestor and Admin/Ops surfaces with role-based access

## Shared platform foundations
- Responsive PWA shell, accessible navigation, deep links and install metadata.
- One identity/session layer; server-side authorization on every private resource.
- Durable user-scoped persistence only when a database is configured and tested; no false multi-user claims from localStorage.
- Shared profile, media upload policy, notifications, search, reporting, blocking, moderation and audit events.
- API contracts, schema validation, rate limits, idempotency, structured logs and health/readiness endpoints.
- Feature flags and capability registry: unavailable integrations remain visibly disabled, never simulated as successful.
- Export/delete controls and documented retention; minimize sensitive data.

## HopeAI — normal conversational assistant
Build a familiar chat experience: persistent conversation list, new chat, streaming response UI, markdown/code rendering, stop/regenerate, copy, edit/resend, attachments only after safe upload handling, conversation search, and user-controlled history deletion. Server-side provider adapter must support configurable model providers through environment secrets; secrets never reach the browser. Add request authentication, per-user quotas, rate limits, timeouts/cancellation, bounded context, provider error handling, abuse controls, redacted logs, token/cost ceilings and an explicit unavailable state when no provider key is configured. Do not claim a connected LLM until a real provider call succeeds in hosted testing.

## Money, Web3 and high-risk boundaries
- Wallet: connect an established browser wallet; watch-only by default. Never request or store seed phrases/private keys. Signing is user-approved in wallet UI.
- Exchange: begin with public market data and watchlists. Any real order routing requires an explicitly configured reputable provider, jurisdiction/compliance review, suitability/risk disclosures and user confirmation.
- Day trading: paper-trading simulator first, with delayed/live market-data status clearly labeled. No promise of returns.
- NFTs: gallery and metadata first; testnet mint only behind wallet confirmation. Mainnet minting requires a separate explicit release gate.
- Gambling/chance games: launch as free entertainment with non-redeemable credits, no deposits, prizes, cashout or token wagering. Real-money gambling is not part of this release and requires jurisdiction-specific licensing, age/identity controls, responsible-play controls and legal review.
- Payments: hosted checkout only for clearly described non-investment goods/membership, with verified webhooks and idempotent ledger. Never mix checkout with fundraising or securities.

## Launch gates
A module may be marked LIVE only when its end-to-end path is demonstrated on the deployed build with tests and operational evidence. Otherwise label it PREVIEW, SIMULATOR, TESTNET, WAITLIST or DISABLED. Release gates include auth/session security, database migration and restore drill, provider outage tests, cross-user authorization tests, mobile accessibility smoke tests, moderation/report/block flows, observability and incident runbook. No deployment to the existing live service and no paid resource provisioning is authorized by this branch creation.

## Delivery approach
Keep the work on this branch, preserve `main` and the current Render beta, and integrate the existing Vite/Express/tRPC and unified-shell work rather than deleting either. Build coherent end-to-end journeys across the whole navigation system, but ship each capability only after its dependencies and evidence pass. First user-facing milestone: useful HopeAI chat shell + account-safe social/chat + games/language-learning experiences that remain enjoyable without financial risk.