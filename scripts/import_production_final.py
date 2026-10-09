#!/usr/bin/env python3
"""Fail-closed, reproducible importer for the exact Skycoin Production Final ZIP.

Usage:
  python3 scripts/import_production_final.py ARCHIVE.zip --check-only
  python3 scripts/import_production_final.py ARCHIVE.zip
"""
import argparse
import csv
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import sys
import tempfile
import zipfile

EXPECTED_SHA256 = "b1fedc3cd567c30f98ef9de4a8d3968e33a1944e421b2dd68921cc5619a7641e"
EXPECTED_FILES = 2202
EXPECTED_PREFIX = "skycoin_production/"
MAX_UNCOMPRESSED = 100 * 1024 * 1024


def file_digest(path):
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--check-only", action="store_true", help="Validate archive without writing files")
    parser.add_argument("--dest", type=Path, default=Path("legacy-archive/skycoin-production-final"))
    args = parser.parse_args()

    if not args.archive.is_file():
        parser.error(f"Archive not found: {args.archive}")
    actual_hash = file_digest(args.archive)
    if actual_hash != EXPECTED_SHA256:
        parser.error(f"Archive checksum mismatch: {actual_hash}")

    inventory = []
    seen = set()
    total_bytes = 0
    text_lines = 0
    with zipfile.ZipFile(args.archive) as archive:
        entries = archive.infolist()
        files = [entry for entry in entries if not entry.is_dir()]
        if len(files) != EXPECTED_FILES:
            parser.error(f"Expected {EXPECTED_FILES} files, got {len(files)}")
        for entry in entries:
            name = entry.filename
            if not name.startswith(EXPECTED_PREFIX):
                parser.error(f"Unexpected archive prefix: {name!r}")
            relative = name[len(EXPECTED_PREFIX):]
            if not relative:
                if entry.is_dir():
                    continue
                parser.error("Invalid archive root file")
            parts = PurePosixPath(relative).parts
            if (relative.startswith("/") or "\\" in relative or "\x00" in relative
                    or any(part in {".", "..", ""} for part in relative.split("/") if part)):
                parser.error(f"Unsafe archive path: {name!r}")
            canonical = "/".join(parts)
            if canonical in seen:
                parser.error(f"Duplicate archive entry: {name!r}")
            seen.add(canonical)
            mode = (entry.external_attr >> 16) & 0o170000
            if mode not in {0, stat.S_IFREG, stat.S_IFDIR}:
                parser.error(f"Unsupported filesystem entry (possible symlink): {name!r}")
            if entry.is_dir():
                continue
            total_bytes += entry.file_size
            if total_bytes > MAX_UNCOMPRESSED:
                parser.error("Uncompressed archive exceeds safety limit")
            content = archive.read(entry)
            if len(content) != entry.file_size:
                parser.error(f"Incorrect uncompressed size: {name!r}")
            try:
                utf8 = content.decode("utf-8")
            except UnicodeDecodeError:
                utf8 = None
            if utf8 is not None:
                text_lines += utf8.count("\n") + (1 if utf8 and not utf8.endswith("\n") else 0)
            inventory.append({"path": canonical, "size": entry.file_size, "sha256": hashlib.sha256(content).hexdigest()})

        summary = {
            "archive_sha256": actual_hash,
            "file_count": len(inventory),
            "uncompressed_bytes": total_bytes,
            "utf8_text_lines_including_generated": text_lines,
            "reported_loc_reference": 440682,
            "runtime_status": "quarantined historical source; not integrated or production-verified",
        }
        if args.check_only:
            print(json.dumps(summary, indent=2))
            return
        destination = args.dest.resolve()
        if destination.exists():
            parser.error(f"Destination already exists; refusing overwrite: {destination}")
        destination.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix=".production-final-import-", dir=destination.parent) as temp:
            staging = Path(temp)
            for entry in files:
                relative = entry.filename[len(EXPECTED_PREFIX):]
                output = staging / relative
                output.parent.mkdir(parents=True, exist_ok=True)
                with archive.open(entry) as source, output.open("wb") as target:
                    while block := source.read(1024 * 1024):
                        target.write(block)
            with (staging / "IMPORT_INVENTORY.csv").open("w", newline="", encoding="utf-8") as target:
                writer = csv.DictWriter(target, fieldnames=("path", "size", "sha256"))
                writer.writeheader()
                writer.writerows(inventory)
            (staging / "IMPORT_RECEIPT.json").write_text(json.dumps(summary, indent=2) + "\n")
            os.rename(staging, destination)
        print(f"Imported {len(inventory)} files to {destination}; source remains quarantined")


if __name__ == "__main__":
    try:
        main()
    except (OSError, zipfile.BadZipFile, RuntimeError) as error:
        sys.exit(f"Import failed: {error}")
