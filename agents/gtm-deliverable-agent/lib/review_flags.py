from pathlib import Path


def build_review_summary(deliverable: dict) -> str:
    """The first thing to read, before opening the docx/xlsx -- a punch list
    of everything that needs a human look before this goes anywhere near a
    client. Nothing here means the deliverable is broken; it means these
    specific spots need your judgment."""
    lines = [
        f"# Review Summary — {deliverable['topic']}",
        "",
        "DRAFT — human review required before client use. Nothing has been sent.",
        "",
    ]

    flags = deliverable.get("unverified_flags") or []
    lines.append(f"## Unverified claims excluded ({len(flags)})")
    if flags:
        for item in flags:
            lines.append(f"- **{item['claim']}** — {item['reason_unverified']}")
    else:
        lines.append("- None flagged.")
    lines.append("")

    secondary = [b for b in deliverable["benchmark_master"] if b["is_secondary_source"]]
    lines.append(f"## Secondary-sourced benchmark stats ({len(secondary)})")
    if secondary:
        for item in secondary:
            lines.append(f"- **{item['metric']}** ({item['source']}) — confirm before use, or find the primary source.")
    else:
        lines.append("- None — every benchmark stat traces to a primary source.")
    lines.append("")

    gaps = deliverable.get("data_quality_gaps") or []
    critical_gaps = [g for g in gaps if g["severity"] == "critical"]
    lines.append(f"## Data quality gaps ({len(gaps)}, {len(critical_gaps)} critical)")
    for item in gaps:
        lines.append(f"- [{item['severity'].upper()}] {item['description']}")
    if not gaps:
        lines.append("- None flagged.")
    lines.append("")

    mapping = deliverable.get("client_mapping")
    if mapping:
        unmapped = [m for m in mapping["field_mappings"] if m["mapping_status"] != "confident"]
        lines.append(f"## Client field mappings needing a look ({len(unmapped)} of {len(mapping['field_mappings'])})")
        for item in unmapped:
            lines.append(f"- **{item['raw_column']}** ({item['mapping_status']}) — {item['note']}")
        if not unmapped:
            lines.append("- All columns mapped with confidence.")
        lines.append("")

    low_confidence_scenarios = [
        s
        for s in deliverable["impact_quantification"]["scenarios"]
        if s["confidence_level"] in ("MEDIUM", "LOW")
    ]
    lines.append(f"## Lower-confidence impact scenarios ({len(low_confidence_scenarios)})")
    for item in low_confidence_scenarios:
        lines.append(f"- [{item['confidence_level']}] {item['scenario']} — {item['methodology_note']}")
    if not low_confidence_scenarios:
        lines.append("- All scenarios are HIGH or MEDIUM-HIGH confidence.")

    return "\n".join(lines)


def write_review_summary(deliverable: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(build_review_summary(deliverable))
