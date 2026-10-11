# Skycoin Production Final — exact archive intake

**Status: INTAKE PREPARED; ARCHIVE NOT YET COMMITTED.** Do not call the requested 2,202-file GitHub import complete based on this document or the importer alone.

## Source archive verified in the request workspace

| Property | Evidence |
| --- | --- |
| Supplied file | skycoin_production_final (2) (2).zip |
| SHA-256 | b1fedc3cd567c30f98ef9de4a8d3968e33a1944e421b2dd68921cc5619a7641e |
| ZIP size | 10,538,911 bytes |
| Regular ZIP file members | **2,202** |
| Directories | 98 |
| Uncompressed file bytes | 42,778,686 |
| LOC in request | **440,682 (reported, measurement method not established)** |
| Independently counted UTF-8 text lines | **459,259**, counting all decodable files including generated build assets and lockfiles |
| Proposed destination | legacy-archive/skycoin-production-final/ |

The two LOC figures use unspecified/different inclusion rules and must **not** be represented as directly comparable or as unique handwritten source LOC. This archive includes generated build-output artifacts and other non-source material.

This is a separate exact-version intake from the previously verified 1,754-file / 355,835 selected-source-LOC recovered historical archive under legacy-archive/skycoin-production-2026-09/. Do not overwrite or silently merge the two histories.

## Verified importer

The repository includes scripts/import_production_final.py:

1. Rejects any ZIP other than the exact SHA-256 above.
2. Requires precisely 2,202 file members.
3. Rejects path traversal and symlinks and imposes an uncompressed-size limit.
4. Extracts to a separate directory without overwriting it.
5. Generates SHA-256 file inventory and machine-readable receipt.
6. Explicitly labels the extracted data as quarantined historical source, not part of the active app.

Validation was executed against the supplied ZIP in the request workspace. Check-only produced 2,202 files and 459,259 UTF-8 text lines; a temporary import produced 2,202 extracted files plus two receipt files. **This local verification is not a GitHub CI or deploy claim.**

Run after obtaining the ZIP in the GitHub-capable working environment:

    python3 scripts/import_production_final.py 'skycoin_production_final (2) (2).zip' --check-only
    python3 scripts/import_production_final.py 'skycoin_production_final (2) (2).zip'

Then audit imported files for secrets, dependencies, insecure wallet/key patterns, and contradictory claims; open a reviewable import PR; execute relevant CI; merge only after exact-head checks pass.

## Unresolved blocking boundary

The uploaded 10.5-MB binary ZIP exists in the ChatGPT file-processing workspace, but the current GitHub connector offers text/object Git writes and **no direct pathway to read that local binary file** for transfer to a GitHub blob or release asset. Thus this intake PR intentionally contains **only the verification/import tooling and status document**, not the 2,202 source files, not a complete transfer, and not a production deployment.

Do not label this version as merged, complete, production-ready, or integrated until the ZIP's bytes have been actually transferred to the repository, validated, and merged.
