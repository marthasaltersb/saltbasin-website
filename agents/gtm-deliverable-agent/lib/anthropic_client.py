import os
from pathlib import Path

import anthropic

AGENT_ROOT = Path(__file__).resolve().parent.parent
CONTEXT_PATH = AGENT_ROOT / "context" / "salt_basin_context.md"
SCHEMA_PATH = AGENT_ROOT / "schema" / "capability_mapping_schema.json"

# Sonnet 5 does the research + drafting (deep reasoning, citation judgment).
# Haiku 4.5 handles the mechanical client-field-matching pass in client_data.py.
DRAFT_MODEL = "claude-sonnet-5"
MAPPING_MODEL = "claude-haiku-4-5"

WEB_SEARCH_TOOL = {"type": "web_search_20260209", "name": "web_search"}


def get_client() -> anthropic.Anthropic:
    return anthropic.Anthropic()


def load_context_text() -> str:
    return CONTEXT_PATH.read_text()


def build_cached_system(extra_text: str | None = None) -> list[dict]:
    """Cached brand/methodology block first, optional per-run addition after --
    the addition must come after the cache_control breakpoint or it changes
    the prefix and invalidates the cache for every other run."""
    blocks = [
        {
            "type": "text",
            "text": load_context_text(),
            "cache_control": {"type": "ephemeral"},
        }
    ]
    if extra_text:
        blocks.append({"type": "text", "text": extra_text})
    return blocks


def _row(properties: dict) -> dict:
    return {
        "type": "object",
        "properties": properties,
        "required": list(properties.keys()),
        "additionalProperties": False,
    }


_NULLABLE_STRING = {"anyOf": [{"type": "string"}, {"type": "null"}]}
_CONFIDENCE = {"type": "string", "enum": ["HIGH", "MEDIUM-HIGH", "MEDIUM", "LOW"]}

DELIVERABLE_SCHEMA = {
    "type": "object",
    "properties": {
        "topic": {"type": "string"},
        "engagement_client_name": _NULLABLE_STRING,
        "executive_summary": {"type": "string"},
        "benchmark_master": {
            "type": "array",
            "items": _row(
                {
                    "metric": {"type": "string"},
                    "value": {"type": "string"},
                    "source": {"type": "string"},
                    "year": {"type": "string"},
                    "sample_size": _NULLABLE_STRING,
                    "url": _NULLABLE_STRING,
                    "relevance_note": {"type": "string"},
                    "is_secondary_source": {"type": "boolean"},
                }
            ),
        },
        "industry_breakdown": {
            "type": "array",
            "items": _row(
                {
                    "industry": {"type": "string"},
                    "leakage_or_risk_mechanism": {"type": "string"},
                    "root_cause": {"type": "string"},
                    "rate_estimate": {"type": "string"},
                    "rate_source": {"type": "string"},
                    "program_resolution": {"type": "string"},
                    "q2r_stage_affected": {"type": "string"},
                }
            ),
        },
        "assumptions_methodology": _row(
            {
                "verified_statistics": {
                    "type": "array",
                    "items": _row(
                        {
                            "statistic_name": {"type": "string"},
                            "value_used": {"type": "string"},
                            "primary_source": {"type": "string"},
                            "publication_date": {"type": "string"},
                            "sample_size": _NULLABLE_STRING,
                            "url": _NULLABLE_STRING,
                            "how_applied": {"type": "string"},
                        }
                    ),
                },
                "modeled_assumptions": {
                    "type": "array",
                    "items": _row(
                        {
                            "assumption_name": {"type": "string"},
                            "value_used": {"type": "string"},
                            "conservative": {"type": "string"},
                            "base": {"type": "string"},
                            "optimistic": {"type": "string"},
                            "rationale": {"type": "string"},
                            "recommendation": {"type": "string"},
                        }
                    ),
                },
                "scenario_source_mapping": {
                    "type": "array",
                    "items": _row(
                        {
                            "scenario": {"type": "string"},
                            "mapped_source_category": {"type": "string"},
                            "direct_citation": {"type": "string"},
                            "inference_gap": {"type": "string"},
                            "confidence_level": _CONFIDENCE,
                            "note": {"type": "string"},
                        }
                    ),
                },
            }
        ),
        "impact_quantification": _row(
            {
                "recovery_rate_pct": {"type": "number"},
                "recovery_rate_source_note": {"type": "string"},
                "program_three_year_cost_usd": {
                    "anyOf": [{"type": "number"}, {"type": "null"}]
                },
                "valuation_multiple": {
                    "anyOf": [{"type": "number"}, {"type": "null"}]
                },
                "valuation_multiple_source_note": _NULLABLE_STRING,
                "scenarios": {
                    "type": "array",
                    "items": _row(
                        {
                            "scenario": {"type": "string"},
                            "conservative_rate_pct": {"type": "number"},
                            "base_rate_pct": {"type": "number"},
                            "high_rate_pct": {"type": "number"},
                            "methodology_note": {"type": "string"},
                            "confidence_level": _CONFIDENCE,
                        }
                    ),
                },
            }
        ),
        "client_mapping": {
            "anyOf": [
                {"type": "null"},
                _row(
                    {
                        "client_name": {"type": "string"},
                        "target_schema": {
                            "type": "string",
                            "enum": [
                                "capability_taxonomy_fields",
                                "contract_revenue_fields",
                                "mixed",
                                "unclear",
                            ],
                        },
                        "field_mappings": {
                            "type": "array",
                            "items": _row(
                                {
                                    "raw_column": {"type": "string"},
                                    "mapped_field": _NULLABLE_STRING,
                                    "mapping_status": {
                                        "type": "string",
                                        "enum": ["confident", "uncertain", "unmapped"],
                                    },
                                    "note": {"type": "string"},
                                }
                            ),
                        },
                        "client_actuals_vs_benchmark": {
                            "type": "array",
                            "items": _row(
                                {
                                    "metric": {"type": "string"},
                                    "client_value": _NULLABLE_STRING,
                                    "benchmark_value": {"type": "string"},
                                    "delta_description": {"type": "string"},
                                    "confidence_level": _CONFIDENCE,
                                }
                            ),
                        },
                    }
                ),
            ]
        },
        "data_quality_gaps": {
            "type": "array",
            "items": _row(
                {
                    "description": {"type": "string"},
                    "severity": {
                        "type": "string",
                        "enum": ["critical", "moderate", "minor"],
                    },
                    "variance_pct": {
                        "anyOf": [{"type": "number"}, {"type": "null"}]
                    },
                    "threshold_action": {
                        "anyOf": [
                            {
                                "type": "string",
                                "enum": [
                                    "no_action",
                                    "warning",
                                    "confidence_reduction",
                                    "escalation",
                                ],
                            },
                            {"type": "null"},
                        ]
                    },
                    "exception_class": {
                        "anyOf": [
                            {
                                "type": "string",
                                "enum": [
                                    "timing",
                                    "mapping",
                                    "source_quality",
                                    "rule_defect",
                                    "entitlement",
                                    "approved_adjustment",
                                    "other",
                                ],
                            },
                            {"type": "null"},
                        ]
                    },
                }
            ),
        },
        "unverified_flags": {
            "type": "array",
            "items": _row(
                {
                    "claim": {"type": "string"},
                    "reason_unverified": {"type": "string"},
                }
            ),
        },
    },
    "required": [
        "topic",
        "engagement_client_name",
        "executive_summary",
        "benchmark_master",
        "industry_breakdown",
        "assumptions_methodology",
        "impact_quantification",
        "client_mapping",
        "data_quality_gaps",
        "unverified_flags",
    ],
    "additionalProperties": False,
}

OUTPUT_FORMAT = {"type": "json_schema", "schema": DELIVERABLE_SCHEMA}
