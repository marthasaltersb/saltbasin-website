#!/usr/bin/env python3
"""Run the agent live (not via Batch API) against a topic you already have
a known-good answer for, so you can compare its output to what you actually
produced -- the golden-test-set step from the roadmap's testing checklist.
Needs ANTHROPIC_API_KEY set; costs a normal live-call amount, not batch
pricing -- that tradeoff is deliberate for fast iteration while testing.

Usage:
  python golden_tests/run_golden_test.py \\
      --topic "Revenue leakage in usage-based billing" \\
      --reference source-docs/golden-deliverables/HandoverOS_Revenue_Leakage_v22.xlsx
"""
import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from lib.anthropic_client import (
    DRAFT_MODEL,
    OUTPUT_FORMAT,
    WEB_SEARCH_TOOL,
    build_cached_system,
    get_client,
)
from lib.docx_template import build_docx
from lib.review_flags import build_review_summary
from lib.xlsx_template import build_xlsx

OUTPUT_DIR = Path(__file__).parent / "output"


def run_live(topic: str) -> dict:
    client = get_client()
    response = client.messages.create(
        model=DRAFT_MODEL,
        max_tokens=16000,
        system=build_cached_system(),
        tools=[WEB_SEARCH_TOOL],
        output_config={"format": OUTPUT_FORMAT},
        messages=[
            {
                "role": "user",
                "content": (
                    f"Research current developments on: {topic}. Follow the "
                    "deliverable structure and citation standard in your "
                    "system context exactly."
                ),
            }
        ],
    )
    text_blocks = [b.text for b in response.content if b.type == "text"]
    print(
        f"Tokens -- input: {response.usage.input_tokens}, "
        f"cache read: {getattr(response.usage, 'cache_read_input_tokens', 0)}, "
        f"output: {response.usage.output_tokens}"
    )
    return json.loads(text_blocks[0])


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--topic", required=True)
    parser.add_argument(
        "--reference",
        help="Path to the known-good deliverable to compare against (opened separately, side by side).",
    )
    args = parser.parse_args()

    print(f"Running live against: {args.topic}")
    deliverable = run_live(args.topic)

    run_dir = OUTPUT_DIR / datetime.now().strftime("%Y%m%d-%H%M%S")
    build_xlsx(deliverable, run_dir / "deliverable.xlsx")
    build_docx(deliverable, run_dir / "deliverable.docx")
    (run_dir / "REVIEW_ME_FIRST.md").write_text(build_review_summary(deliverable))
    (run_dir / "raw_response.json").write_text(json.dumps(deliverable, indent=2))

    print(f"\nWrote {run_dir}")
    print("\nComparison checklist -- open both side by side and check:")
    print("  [ ] Section structure matches: Executive Summary, Benchmark Master,")
    print("      Assumptions & Methodology (all 3 sections), Impact Quantification")
    print("  [ ] Every benchmark stat traces to a real source (open the URLs)")
    print("  [ ] Modeled assumptions are labeled as such, not presented as verified")
    print("  [ ] Confidence levels in scenario-to-source mapping look justified,")
    print("      not uniformly HIGH")
    print("  [ ] Tone matches Strategic Operator voice -- direct, no hedging,")
    print("      no generic consulting language")
    print("  [ ] Nothing in the reference deliverable's numbers was fabricated here")
    if args.reference:
        print(f"\nReference: {args.reference}")
    print(
        "\nLog what you correct and why (wrong tone / weak source / missed "
        "connection) -- that log becomes the prompt-refinement punch list."
    )


if __name__ == "__main__":
    main()
