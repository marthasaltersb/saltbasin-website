#!/usr/bin/env python3
"""Poll a batch and, once finished, generate the docx/xlsx/review-summary
for every succeeded request. Nothing here publishes or sends anything --
files land in OUTPUT_DIR for manual review. Run with no arguments to check
every batch still pending in output/pending_batches.json."""
import argparse
import json
import re
from datetime import date
from pathlib import Path

from config import OUTPUT_DIR
from lib.batch_jobs import (
    PENDING_BATCHES_PATH,
    clear_pending_batch,
    fetch_batch_results,
    poll_batch,
)
from lib.docx_template import build_docx
from lib.review_flags import write_review_summary
from lib.xlsx_template import build_xlsx


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")[:60]


def _write_deliverable(deliverable: dict, client_arr: float | None) -> Path:
    slug = _slugify(deliverable.get("engagement_client_name") or deliverable["topic"])
    out_dir = OUTPUT_DIR / f"{date.today().isoformat()}-{slug}"
    build_xlsx(deliverable, out_dir / "deliverable.xlsx", client_arr=client_arr)
    build_docx(deliverable, out_dir / "deliverable.docx")
    write_review_summary(deliverable, out_dir / "REVIEW_ME_FIRST.md")
    return out_dir


def _process_batch(entry: dict) -> None:
    batch_id = entry["batch_id"]
    status = poll_batch(batch_id)
    print(f"\nBatch {batch_id} ({entry['mode']}) -- {status['processing_status']}")
    print(f"  {status['request_counts']}")

    if status["processing_status"] != "ended":
        print("  Still processing -- check back later.")
        return

    results = fetch_batch_results(batch_id)
    for custom_id, result in results.items():
        if result["status"] != "succeeded":
            error_dir = OUTPUT_DIR / f"{date.today().isoformat()}-ERROR-{custom_id}"
            error_dir.mkdir(parents=True, exist_ok=True)
            (error_dir / "error.txt").write_text(
                f"Batch {batch_id} / {custom_id}: {result['status']}\n{result['error']}"
            )
            print(f"  [{custom_id}] {result['status']}: {result['error']} -- see {error_dir}")
            continue

        out_dir = _write_deliverable(result["deliverable"], entry.get("client_arr"))
        print(f"  [{custom_id}] wrote {out_dir}")

    clear_pending_batch(batch_id)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--batch-id", help="Check a specific batch instead of every pending one.")
    args = parser.parse_args()

    if args.batch_id:
        _process_batch({"batch_id": args.batch_id, "mode": "manual"})
        return

    if not PENDING_BATCHES_PATH.exists():
        print("No pending batches recorded.")
        return

    entries = json.loads(PENDING_BATCHES_PATH.read_text())
    if not entries:
        print("No pending batches recorded.")
        return

    for entry in entries:
        _process_batch(entry)


if __name__ == "__main__":
    main()
