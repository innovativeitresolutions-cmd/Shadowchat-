# SKYCOIN4444 — 402,000 Source-Line Target (Evidence, Not Padding)

The requested **402,000 LOC** target is a *planning target for meaningful software*, not a production-readiness criterion. Do not fill the gap by duplicating code, including generated assets, adding empty components, or mistaking quarantined historical code for deployed product functionality.

## What the numbers mean

- **Active source:** hand-maintained code outside `legacy-archive/`, test directories, generated build directories, dependency directories, and minified files.
- **Tests:** hand-maintained `.test`/`.spec` code and files under `tests/`.
- **Legacy:** historical imported source under `legacy-archive/`, deliberately **not loaded** by the active engineering beta runtime.
- **Total:** active + tests + legacy. This is for archival transparency, **not** for claiming the active platform contains all those features.
- **Physical LOC:** UTF-8 lines including comments and blank lines; not executable or functional SLOC.

Run against the checked-out repository:

```bash
npm run loc:audit
npm run loc:audit -- --json
```

### Baseline artifact context (October 2026)

The repo's prior exact-recovery import documented **355,835 selected historical source LOC**, validated by inventory; this is an archival measurement. It is not proof of active feature execution, database availability, model connectivity, external payments, or deployed integrations.

The uploaded `skycoin_production_final (2) (2).zip` contains historical source plus generated `build-output` artifacts. Counting generated bundles and duplicated vendor chunks as new source would substantially overstate real engineering progress. Source from that ZIP and the existing recovered archive may overlap, so their counts must **not be added together**.

## Progress standard

Invest in the actual beta user journeys and engineering quality: HopeAI; HopeAI Impact/charity; Social; education; safe non-cash games; marketplace; authentication and durable persistence; navigation; integration tests; observability. Track independently:

1. Complete, tested functionality and its user-facing boundary.
2. Green checks and exact-head CI.
3. What has been merged and deployed, versus what is quarantined.
4. Reproducible, disjoint source/test/legacy line counts.

If a verified, useful release takes fewer than 402,000 lines, **do not pad it**. More code is not a substitute for better software.
