// Structured-output JSON schema for a GTM deliverable, ported field-for-field
// from agents/gtm-deliverable-agent/lib/anthropic_client.py's
// DELIVERABLE_SCHEMA. Keep these two in sync if either changes.

function row(properties) {
  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
  };
}

const NULLABLE_STRING = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const CONFIDENCE = { type: 'string', enum: ['HIGH', 'MEDIUM-HIGH', 'MEDIUM', 'LOW'] };

export const DELIVERABLE_SCHEMA = {
  type: 'object',
  properties: {
    topic: { type: 'string' },
    engagement_client_name: NULLABLE_STRING,
    executive_summary: { type: 'string' },
    benchmark_master: {
      type: 'array',
      items: row({
        metric: { type: 'string' },
        value: { type: 'string' },
        source: { type: 'string' },
        year: { type: 'string' },
        sample_size: NULLABLE_STRING,
        url: NULLABLE_STRING,
        relevance_note: { type: 'string' },
        is_secondary_source: { type: 'boolean' },
      }),
    },
    industry_breakdown: {
      type: 'array',
      items: row({
        industry: { type: 'string' },
        leakage_or_risk_mechanism: { type: 'string' },
        root_cause: { type: 'string' },
        rate_estimate: { type: 'string' },
        rate_source: { type: 'string' },
        program_resolution: { type: 'string' },
        q2r_stage_affected: { type: 'string' },
      }),
    },
    assumptions_methodology: row({
      verified_statistics: {
        type: 'array',
        items: row({
          statistic_name: { type: 'string' },
          value_used: { type: 'string' },
          primary_source: { type: 'string' },
          publication_date: { type: 'string' },
          sample_size: NULLABLE_STRING,
          url: NULLABLE_STRING,
          how_applied: { type: 'string' },
        }),
      },
      modeled_assumptions: {
        type: 'array',
        items: row({
          assumption_name: { type: 'string' },
          value_used: { type: 'string' },
          conservative: { type: 'string' },
          base: { type: 'string' },
          optimistic: { type: 'string' },
          rationale: { type: 'string' },
          recommendation: { type: 'string' },
        }),
      },
      scenario_source_mapping: {
        type: 'array',
        items: row({
          scenario: { type: 'string' },
          mapped_source_category: { type: 'string' },
          direct_citation: { type: 'string' },
          inference_gap: { type: 'string' },
          confidence_level: CONFIDENCE,
          note: { type: 'string' },
        }),
      },
    }),
    impact_quantification: row({
      recovery_rate_pct: { type: 'number' },
      recovery_rate_source_note: { type: 'string' },
      program_three_year_cost_usd: { anyOf: [{ type: 'number' }, { type: 'null' }] },
      valuation_multiple: { anyOf: [{ type: 'number' }, { type: 'null' }] },
      valuation_multiple_source_note: NULLABLE_STRING,
      scenarios: {
        type: 'array',
        items: row({
          scenario: { type: 'string' },
          conservative_rate_pct: { type: 'number' },
          base_rate_pct: { type: 'number' },
          high_rate_pct: { type: 'number' },
          methodology_note: { type: 'string' },
          confidence_level: CONFIDENCE,
        }),
      },
    }),
    client_mapping: {
      anyOf: [
        { type: 'null' },
        row({
          client_name: { type: 'string' },
          target_schema: {
            type: 'string',
            enum: ['capability_taxonomy_fields', 'contract_revenue_fields', 'mixed', 'unclear'],
          },
          field_mappings: {
            type: 'array',
            items: row({
              raw_column: { type: 'string' },
              mapped_field: NULLABLE_STRING,
              mapping_status: { type: 'string', enum: ['confident', 'uncertain', 'unmapped'] },
              note: { type: 'string' },
            }),
          },
          client_actuals_vs_benchmark: {
            type: 'array',
            items: row({
              metric: { type: 'string' },
              client_value: NULLABLE_STRING,
              benchmark_value: { type: 'string' },
              delta_description: { type: 'string' },
              confidence_level: CONFIDENCE,
            }),
          },
        }),
      ],
    },
    data_quality_gaps: {
      type: 'array',
      items: row({
        description: { type: 'string' },
        severity: { type: 'string', enum: ['critical', 'moderate', 'minor'] },
        variance_pct: { anyOf: [{ type: 'number' }, { type: 'null' }] },
        threshold_action: {
          anyOf: [
            { type: 'string', enum: ['no_action', 'warning', 'confidence_reduction', 'escalation'] },
            { type: 'null' },
          ],
        },
        exception_class: {
          anyOf: [
            {
              type: 'string',
              enum: ['timing', 'mapping', 'source_quality', 'rule_defect', 'entitlement', 'approved_adjustment', 'other'],
            },
            { type: 'null' },
          ],
        },
      }),
    },
    unverified_flags: {
      type: 'array',
      items: row({
        claim: { type: 'string' },
        reason_unverified: { type: 'string' },
      }),
    },
  },
  required: [
    'topic',
    'engagement_client_name',
    'executive_summary',
    'benchmark_master',
    'industry_breakdown',
    'assumptions_methodology',
    'impact_quantification',
    'client_mapping',
    'data_quality_gaps',
    'unverified_flags',
  ],
  additionalProperties: false,
};

export const OUTPUT_FORMAT = { type: 'json_schema', schema: DELIVERABLE_SCHEMA };
