# Legacy ecosystem import status

This repository is a **quality-first product baseline**, not a claim that every historical SKYCOIN4444 source file has been validated or imported.

A prior local consolidation audit measured the recovered legacy snapshot at approximately **355,835 source lines across 1,693 source files** after excluding generated/build output and obvious duplicate archive copies. Two large legacy archives were substantially overlapping snapshots rather than independent 350k-line systems.

The legacy code contains useful domain work across AI, social, marketplace, gaming, education, crypto/Web3, admin, analytics, infrastructure, and other areas. It also contains contradictory product claims, placeholder persistence, simulated external services, duplicate pages, inconsistent token naming/economics, and security-sensitive wallet patterns that should not be copied blindly.

## Import policy

Legacy modules should move into this repository only when they meet these gates:

- clear ownership and purpose;
- no duplicate active implementation;
- truthful capability labels;
- deterministic unit/integration tests where practical;
- loading, error, empty, and degraded states;
- privacy/security boundaries;
- no embedded secrets or unsafe key-management assumptions;
- accessibility/mobile behavior for user-facing surfaces;
- external dependencies fail closed;
- documentation identifies simulation vs verified execution.

## Current baseline focus

The first committed baseline prioritizes the flagship user journeys:

1. HopeAI
2. HopeAI Impact / charity planning
3. major navigation
4. Social
5. Marketplace
6. Games
7. Education
8. Wallet / Crypto
9. Security / Privacy
10. Release Operations

The purpose is to create a dependable integration target for selectively migrating validated legacy functionality rather than reintroducing all historical technical debt at once.
