#!/usr/bin/env python3
"""Validate a pinned official FunctionGemma snapshot and emit provenance."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from huggingface_hub import HfApi


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--snapshot", required=True, type=Path)
    parser.add_argument("--repo", default="google/functiongemma-270m-it")
    parser.add_argument("--revision", required=True)
    args = parser.parse_args()

    snapshot = args.snapshot.resolve()
    api = HfApi()
    remote_files = {
        item.path: item
        for item in api.list_repo_tree(args.repo, revision=args.revision, recursive=True, expand=True)
    }
    files = []
    failures = []
    for local_file in sorted(path for path in snapshot.rglob("*") if path.is_file() and ".cache" not in path.parts):
        relative = local_file.relative_to(snapshot).as_posix()
        remote = remote_files.get(relative)
        if remote is None:
            failures.append(f"Arquivo local nao pertence ao snapshot remoto: {relative}")
            continue
        local_hash = sha256(local_file)
        expected_hash = getattr(getattr(remote, "lfs", None), "sha256", None)
        verified = expected_hash is None or local_hash == expected_hash
        if not verified:
            failures.append(f"SHA-256 divergente: {relative}")
        files.append({
            "path": relative,
            "bytes": local_file.stat().st_size,
            "sha256": local_hash,
            "remoteLfsSha256": expected_hash,
            "verified": verified,
            "usage": "excluded_fine_tuned_example" if relative == "tiny_garden.litertlm" else "source_snapshot",
        })

    missing = sorted(set(remote_files) - {file["path"] for file in files})
    if missing:
        failures.extend(f"Arquivo remoto ausente localmente: {path}" for path in missing)

    manifest = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": {
            "repo": args.repo,
            "revision": args.revision,
            "origin": f"https://huggingface.co/{args.repo}/tree/{args.revision}",
            "license": "gemma",
        },
        "integrity": {"valid": not failures, "failures": failures},
        "policy": {
            "mobileActionsFineTunedUsed": False,
            "tinyGardenArtifactUsed": False,
            "originalSnapshotMutable": False,
        },
        "files": files,
    }
    output = snapshot / "snapshot-manifest.json"
    output.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(f"MANIFEST={output}")
    print(f"INTEGRITY_VALID={manifest['integrity']['valid']}")
    print(f"FILES_VALIDATED={len(files)}")
    if failures:
        raise SystemExit("; ".join(failures))


if __name__ == "__main__":
    main()
