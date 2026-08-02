#!/usr/bin/env python3
"""Submit the recurring benchmark-refresh batch -- no client data, safe to
run unattended on a schedule (see .github/workflows/gtm-benchmark-*.yml).
Each topic in schema/topics.json becomes one request in the batch."""
import argparse
import json

from config import AGENT_ROOT
from lib.batch_jobs import EXEC_STYLES, submit_benchmark_refresh_batch

TOPICS_PATH = AGENT_ROOT / "schema" / "topics.json"


def load_topics() -> list[str]:
    data = json.loads(TOPICS_PATH.read_text())
    return data["topics"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--topic",
        action="append",
        dest="topics",
        help="Override schema/topics.json -- repeat for multiple topics.",
    )
    parser.add_argument(
        "--exec-style",
        choices=EXEC_STYLES,
        default="financial_first",
        help="Executive summary framing, from Betsy's own exec-templates library (default: financial_first).",
    )
    args = parser.parse_args()

    topics = args.topics or load_topics()
    print(f"Submitting benchmark refresh batch for {len(topics)} topic(s):")
    for topic in topics:
        print(f"  - {topic}")

    batch_id = submit_benchmark_refresh_batch(topics, args.exec_style)
    print(f"\nBatch submitted: {batch_id}")
    print("Most batches finish within an hour (max 24h). Fetch results with:")
    print(f"  python fetch_batch_results.py --batch-id {batch_id}")


if __name__ == "__main__":
    main()
