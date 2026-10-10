#!/usr/bin/env python3
"""No API key needed. Runs the deterministic client-data normalization pass
against a deliberately messy fixture (missing values, mixed EUR/USD in one
column, ambiguous abbreviations, a duplicate-looking row) and checks it
flags what it can't confidently resolve instead of guessing -- the
'dry-run the edge cases' step from the roadmap's testing checklist."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.client_data import build_client_data_summary

FIXTURE = Path(__file__).parent / "fixtures" / "messy_client_export.csv"


def main():
    summary = build_client_data_summary(FIXTURE, "Dry-Run Fixture Client")

    print(f"Columns: {summary['row_count']} rows, "
          f"{len(summary['matched_fields'])} matched, "
          f"{len(summary['unmatched_columns_with_samples'])} unmatched")
    print(f"Target schema guess: {summary['target_schema_guess']}\n")

    print("Matched (confident alias match):")
    for col, field in summary["matched_fields"].items():
        print(f"  {col!r} -> {field}")

    print("\nUnmatched (left for model judgment, not guessed):")
    for col, samples in summary["unmatched_columns_with_samples"].items():
        print(f"  {col!r}: {samples}")

    # The fixture is designed so "Annual Contract Value" (mixed USD/EUR,
    # ambiguous vs. ARR/ACV) and "Weird Legacy Code" (no plausible schema
    # match at all) must NOT be auto-matched -- if either shows up in
    # matched_fields, the heuristic is guessing instead of flagging.
    unsafe_matches = {"Annual Contract Value", "Weird Legacy Code"} & set(
        summary["matched_fields"]
    )
    if unsafe_matches:
        print(f"\nFAIL: matched columns that should have been flagged instead: {unsafe_matches}")
        sys.exit(1)

    print("\nPASS: ambiguous/mixed-currency/no-match columns were correctly left unmatched.")


if __name__ == "__main__":
    main()
