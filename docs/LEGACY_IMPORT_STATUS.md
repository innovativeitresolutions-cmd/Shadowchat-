# Legacy ecosystem import status

The full recovered SKYCOIN4444 legacy archive is now preserved in this repository under `legacy-archive/` as **quarantined historical source**.

The import was reconstructed from the previously consolidated archive and verified in GitHub Actions before commit.

## Verified archive evidence

- Recovered archive SHA-256: `beca31f9ff509662e0550df2b0e650a9a21fbe63b601201a2c6fd3e9233cf5b8`
- Inventory rows verified: **1,754 / 1,754**
- Exact inventory SHA-256 matches: **1,754**
- Missing inventory files: **0**
- Hash mismatches: **0**
- Selected source files: **1,693**
- Selected source LOC: **355,835**
- Optimized deployment helpers verified separately: **4 / 4**
- Total recovered files verified: **1,758**

See `legacy-archive/IMPORT_VERIFICATION.json`, `legacy-archive/IMPORT_VERIFICATION.md`, `legacy-archive/FILE_INVENTORY.csv`, and `legacy-archive/CONSOLIDATION_MANIFEST.md`.

## Important boundary

The legacy tree is **not part of the active runtime**. Importing it preserves the historical engineering work; it does not certify it, deploy it, or make old claims true.

The legacy source contains useful domain work across AI, social, marketplace, gaming, education, crypto/Web3, admin, analytics, infrastructure, and other areas. It also contains contradictory product claims, placeholder persistence, simulated external services, duplicate pages, inconsistent token naming/economics, and security-sensitive wallet patterns.

Historical files may mention production, real mining, live financial services, escrow, verified charities, enterprise security, provider connectivity, or other external capabilities. Those references are historical source material only unless separately verified by the current quality-first runtime and release evidence.

## Integration policy

Legacy modules should move from `legacy-archive/` into the active product only when they meet these gates:

- clear ownership and purpose;
- no duplicate active implementation;
- truthful capability labels;
- deterministic unit/integration tests where practical;
- loading, error, empty, and degraded states;
- privacy/security boundaries;
- no embedded secrets or unsafe key-management assumptions;
- accessibility/mobile behavior for user-facing surfaces;
- external dependencies fail closed;
- documentation identifies simulation versus verified execution.

## Active baseline focus

The active quality-first baseline continues to prioritize:

1. HopeAI
2. HopeAI Impact / charity planning
3. major navigation
4. Social / ShadowChat
5. Marketplace
6. Games
7. Education / SkySchool
8. Wallet / Crypto
9. Security / Privacy
10. Release Operations

The archive is now fully preserved in GitHub for selective migration without forcing historical technical debt into the active runtime.
