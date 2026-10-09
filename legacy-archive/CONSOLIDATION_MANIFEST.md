# SKYCOIN4444 Legacy Consolidation Manifest

This bundle preserves a deduplicated legacy source snapshot for review/import into the current SKYCOIN4444 repository. It is **not** a claim that all code should be merged unchanged. New protected-main implementations should win over stale legacy files.

## Source selection

- Preferred legacy source: `SKYCOIN4444_ENTERPRISE_RELEASE_v1.0_FINAL(2).zip` → `01_SOURCE_CODE/` (newer snapshot).
- Older comparison source: `skycoin_production_final (2) (2).zip`.
- Additional unique deployment helpers: `skycoin4444-production-optimized.zip` → `scripts/`.
- Generated build output, nested `.git`, dependency folders, caches, and vendor bundles are intentionally excluded.
- Requested external repository `https://github.com/innovativeitresolutions-cmd/Shadowchat-.git` was not retrievable in this environment and is therefore **not silently substituted**.

## Measured source volume

- Selected code files: **1,693**
- Selected source LOC: **355,835**
- LOC by extension: `{".ts": 185835, ".tsx": 162363, ".sql": 2864, ".css": 2229, ".mjs": 1472, ".js": 821, ".sh": 211, ".html": 40}`

This legacy snapshot alone does **not** support a truthful 400,000-LOC claim. Reaching/exceeding 400k must be measured after combining unique current-main code and any accessible Shadowchat source, without double-counting generated or duplicate files.

## Deduplication evidence

Comparing the older and newer source snapshots by relative path + SHA-256:

- Shared paths: **1,748**
- Byte-identical shared files: **1,706**
- Changed shared files: **42**
- Older-only files: **8**
- Newer-only files: **6**

## Merge policy

1. Do not replace current protected-main files wholesale.
2. Import unique capabilities into current modules behind current auth/persistence/security boundaries.
3. Re-run typecheck, lint, unit/integration/release tests, production build, dependency/security checks, and exact-head CI before merge.
4. Preserve truthful degraded states. Legacy mock/simulated payment, custody, provider, blockchain, identity, compliance, or regulated-gambling claims must remain disabled unless independently integrated and verified.
5. Keep HopeAI as the single public Hope brand.