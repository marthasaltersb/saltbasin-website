#!/usr/bin/env python3
"""Submit a per-engagement deliverable, optionally with client data.

Client data is read from CLIENT_DATA_DIR (see config.py / .env) -- a local
path you control, never committed to git and never passed through chat.
Only column names, alias-matched fields, small non-identifying samples for
unmatched columns, and numeric aggregates leave this process; row-level
client data is never sent to the API. See lib/client_data.py."""
import argparse
from pathlib import Path

from config import CLIENT_DATA_DIR
from lib.batch_jobs import EXEC_STYLES, submit_engagement_batch
from lib.client_data import build_client_data_summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--topic", required=True, help="Deliverable topic.")
    parser.add_argument(
        "--client-file",
        help="Filename inside CLIENT_DATA_DIR (CSV or XLSX). Omit for a benchmark-only deliverable.",
    )
    parser.add_argument(
        "--client-name",
        help="Client name for the deliverable. Required if --client-file is set.",
    )
    parser.add_argument(
        "--exec-style",
        choices=EXEC_STYLES,
        default="financial_first",
        help="Executive summary framing, from Betsy's own exec-templates library (default: financial_first).",
    )
    args = parser.parse_args()

    client_summary = None
    if args.client_file:
        if not args.client_name:
            parser.error("--client-name is required when --client-file is set.")
        client_path = CLIENT_DATA_DIR / args.client_file
        if not client_path.exists():
            parser.error(
                f"{client_path} not found. Drop the export into {CLIENT_DATA_DIR} first."
            )
        print(f"Normalizing {client_path.name} against the capability mapping schema...")
        client_summary = build_client_data_summary(client_path, args.client_name)
        matched = len(client_summary["matched_fields"])
        unmatched = len(client_summary["unmatched_columns_with_samples"])
        print(
            f"  {matched} column(s) matched confidently, {unmatched} left for the "
            f"model's judgment. Guessed schema: {client_summary['target_schema_guess']}"
        )

    batch_id = submit_engagement_batch(args.topic, client_summary, args.exec_style)
    print(f"\nBatch submitted: {batch_id}")
    print("Fetch results with:")
    print(f"  python fetch_batch_results.py --batch-id {batch_id}")


if __name__ == "__main__":
    main()
