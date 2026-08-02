import json
from datetime import datetime, timezone
from pathlib import Path

from anthropic.types.message_create_params import MessageCreateParamsNonStreaming
from anthropic.types.messages.batch_create_params import Request

from lib.anthropic_client import (
    DRAFT_MODEL,
    OUTPUT_FORMAT,
    WEB_SEARCH_TOOL,
    build_cached_system,
    get_client,
)

AGENT_ROOT = Path(__file__).resolve().parent.parent
PENDING_BATCHES_PATH = AGENT_ROOT / "output" / "pending_batches.json"

RESEARCH_INSTRUCTIONS = (
    "Research current developments (last 12 months unless the topic is "
    "inherently evergreen) on: {topic}. Follow the deliverable structure, "
    "citation standard, and Assumptions & Methodology three-section pattern "
    "specified in your system context exactly. Search for primary-sourced "
    "benchmarks before drafting -- do not draft from memory alone."
)

CLIENT_MAPPING_INSTRUCTIONS = (
    "\n\nThis run includes client data for {client_name} "
    "(source file: {source_file}, {row_count} rows). A deterministic pass "
    "already matched these raw columns to the schema with high confidence:\n"
    "{matched_fields}\n\n"
    "These columns did NOT match confidently and need your judgment -- map "
    "each to a schema field if you're confident, or mark it unmapped with "
    "why (sample values shown, values may be incomplete):\n"
    "{unmatched_columns}\n\n"
    "Numeric aggregates for the matched fields (sum/mean/missing count, "
    "computed from the full dataset locally -- row-level data was not sent):\n"
    "{field_aggregates}\n\n"
    "Guessed target schema for this export: {target_schema_guess} (one of "
    "capability_taxonomy_fields / contract_revenue_fields / mixed / "
    "unclear -- confirm or correct this in your response's client_mapping."
    "target_schema).\n\n"
    "Populate client_mapping and client_actuals_vs_benchmark using this "
    "data. Populate data_quality_gaps for anything incomplete, ambiguous, "
    "or inconsistent -- this is a real deliverable finding, not overhead."
)


def _build_request(
    custom_id: str, topic: str, client_summary: dict | None
) -> Request:
    user_text = RESEARCH_INSTRUCTIONS.format(topic=topic)
    if client_summary:
        user_text += CLIENT_MAPPING_INSTRUCTIONS.format(
            client_name=client_summary["client_name"],
            source_file=client_summary["source_file"],
            row_count=client_summary["row_count"],
            matched_fields=json.dumps(client_summary["matched_fields"], indent=2),
            unmatched_columns=json.dumps(
                client_summary["unmatched_columns_with_samples"], indent=2
            ),
            field_aggregates=json.dumps(client_summary["field_aggregates"], indent=2),
            target_schema_guess=client_summary["target_schema_guess"],
        )

    return Request(
        custom_id=custom_id,
        params=MessageCreateParamsNonStreaming(
            model=DRAFT_MODEL,
            max_tokens=16000,
            system=build_cached_system(),
            tools=[WEB_SEARCH_TOOL],
            output_config={"format": OUTPUT_FORMAT},
            messages=[{"role": "user", "content": user_text}],
        ),
    )


def submit_benchmark_refresh_batch(topics: list[str]) -> str:
    requests = [
        _build_request(custom_id=f"benchmark-{i}", topic=topic, client_summary=None)
        for i, topic in enumerate(topics)
    ]
    client = get_client()
    batch = client.messages.batches.create(requests=requests)
    _record_pending_batch(batch.id, mode="benchmark_refresh", topics=topics)
    return batch.id


def submit_engagement_batch(topic: str, client_summary: dict | None) -> str:
    request = _build_request(
        custom_id="engagement-0", topic=topic, client_summary=client_summary
    )
    client = get_client()
    batch = client.messages.batches.create(requests=[request])
    client_arr = None
    if client_summary:
        client_arr = client_summary["field_aggregates"].get("arr", {}).get("sum")
    _record_pending_batch(
        batch.id,
        mode="engagement",
        topics=[topic],
        client_name=client_summary["client_name"] if client_summary else None,
        client_arr=client_arr,
    )
    return batch.id


def _record_pending_batch(batch_id: str, mode: str, topics: list[str], **extra) -> None:
    PENDING_BATCHES_PATH.parent.mkdir(parents=True, exist_ok=True)
    entries = []
    if PENDING_BATCHES_PATH.exists():
        entries = json.loads(PENDING_BATCHES_PATH.read_text())
    entries.append(
        {
            "batch_id": batch_id,
            "mode": mode,
            "topics": topics,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            **extra,
        }
    )
    PENDING_BATCHES_PATH.write_text(json.dumps(entries, indent=2))


def poll_batch(batch_id: str) -> dict:
    client = get_client()
    batch = client.messages.batches.retrieve(batch_id)
    return {
        "id": batch.id,
        "processing_status": batch.processing_status,
        "request_counts": batch.request_counts.model_dump(),
    }


def fetch_batch_results(batch_id: str) -> dict:
    """Returns {custom_id: {"status": "succeeded"|"errored"|..., "deliverable": dict|None, "error": str|None}}"""
    client = get_client()
    results = {}
    for result in client.messages.batches.results(batch_id):
        if result.result.type == "succeeded":
            message = result.result.message
            text_blocks = [b.text for b in message.content if b.type == "text"]
            deliverable = json.loads(text_blocks[0]) if text_blocks else None
            results[result.custom_id] = {
                "status": "succeeded",
                "deliverable": deliverable,
                "error": None,
                "usage": message.usage.model_dump(),
            }
        else:
            error_detail = getattr(result.result, "error", None)
            results[result.custom_id] = {
                "status": result.result.type,
                "deliverable": None,
                "error": str(error_detail) if error_detail else result.result.type,
                "usage": None,
            }
    return results


def clear_pending_batch(batch_id: str) -> None:
    if not PENDING_BATCHES_PATH.exists():
        return
    entries = json.loads(PENDING_BATCHES_PATH.read_text())
    entries = [e for e in entries if e["batch_id"] != batch_id]
    PENDING_BATCHES_PATH.write_text(json.dumps(entries, indent=2))
