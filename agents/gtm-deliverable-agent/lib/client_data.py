import json
import re
from pathlib import Path

import pandas as pd

from lib.anthropic_client import SCHEMA_PATH

_NUMERIC_LIKE_FIELDS = {
    "arr",
    "mrr",
    "cancellation_arr_impact",
    "nrr",
    "grr",
    "ebitda_margin_pct",
    "churn_rate_pct",
    "expansion_arr",
    "contraction_arr",
    "moic",
    "irr",
    "tvpi",
    "dpi",
    "leakage_exposure_usd",
    "confidence_score",
}


def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", str(text).lower()).strip()


def _load_schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text())


def read_client_export(path: Path) -> pd.DataFrame:
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path)
    if path.suffix.lower() in (".xlsx", ".xls"):
        return pd.read_excel(path)
    raise ValueError(f"Unsupported client export type: {path.suffix} ({path})")


def _score_schema(columns: list[str], schema_fields: list[dict]) -> tuple[int, dict]:
    alias_to_key = {}
    for field in schema_fields:
        alias_to_key[_normalize(field["label"])] = field["key"]
        for alias in field["aliases"]:
            alias_to_key[_normalize(alias)] = field["key"]

    matched = {}
    for col in columns:
        key = alias_to_key.get(_normalize(col))
        if key:
            matched[col] = key
    return len(matched), matched


def normalize_against_schema(df: pd.DataFrame) -> dict:
    """Deterministic alias-based pass. Whatever it can't confidently resolve
    is left for the model's judgment in the batch request -- never guessed
    here."""
    schema = _load_schema()
    columns = list(df.columns)

    capability_score, capability_matched = _score_schema(
        columns, schema["capability_taxonomy_fields"]["fields"]
    )
    contract_score, contract_matched = _score_schema(
        columns, schema["contract_revenue_fields"]["fields"]
    )

    if capability_score == 0 and contract_score == 0:
        target_schema = "unclear"
        matched = {}
    elif capability_score >= contract_score * 2:
        target_schema = "capability_taxonomy_fields"
        matched = capability_matched
    elif contract_score >= capability_score * 2:
        target_schema = "contract_revenue_fields"
        matched = contract_matched
    else:
        target_schema = "mixed"
        matched = {**capability_matched, **contract_matched}

    unmatched_columns = [c for c in columns if c not in matched]

    return {
        "target_schema_guess": target_schema,
        "matched_fields": matched,
        "unmatched_columns": unmatched_columns,
    }


def build_client_data_summary(path: Path, client_name: str) -> dict:
    """Row-level client data never leaves this process. Only column names,
    match results, small non-identifying sample values for unmatched columns,
    and aggregates for numeric mapped fields go into the API request."""
    df = read_client_export(path)
    normalization = normalize_against_schema(df)

    aggregates = {}
    for raw_col, field_key in normalization["matched_fields"].items():
        if field_key in _NUMERIC_LIKE_FIELDS:
            numeric = pd.to_numeric(df[raw_col], errors="coerce")
            aggregates[field_key] = {
                "sum": None if numeric.isna().all() else float(numeric.sum()),
                "mean": None if numeric.isna().all() else float(numeric.mean()),
                "missing_count": int(numeric.isna().sum()),
            }

    unmatched_samples = {}
    for col in normalization["unmatched_columns"]:
        sample_values = df[col].dropna().astype(str).head(3).tolist()
        unmatched_samples[col] = sample_values

    return {
        "client_name": client_name,
        "source_file": path.name,
        "row_count": len(df),
        "target_schema_guess": normalization["target_schema_guess"],
        "matched_fields": normalization["matched_fields"],
        "field_aggregates": aggregates,
        "unmatched_columns_with_samples": unmatched_samples,
    }
