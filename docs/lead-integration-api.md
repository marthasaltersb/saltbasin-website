# Lead Integration API

All endpoints require `x-saltbasin-api-key` matching the server-side
`LEAD_INTEGRATION_API_KEY`. Provider webhook bearer tokens remain in environment
variables and are never returned through public config.

## Ingest

`POST /api/lead-integrations/ingest/:provider`

Supported providers: `pitchbook`, `dnb`, `salesforce`, `hubspot`, `marketo`,
`marketing`, and `generic`.

The adapter accepts common provider field names and normalizes them into the
same lead pipeline used by the public site. At minimum, the payload must resolve
to an email address. Original provider data is retained in `leads.answers` as
structured context.

```json
{
  "id": "00Q123",
  "email": "operator@example.com",
  "name": "Alex Operator",
  "company": { "name": "Example Co", "duns": "123456789" },
  "status": "Qualified",
  "businessNeed": "Repair quote-to-cash handoffs",
  "timeline": "This quarter"
}
```

## Export

`GET /api/lead-integrations/leads/:publicId`

Returns the canonical contact, structured context, transcript, and activity
timeline for one active lead.

## Push Sync

`POST /api/lead-integrations/sync/:provider/:publicId`

Outbound sync must be enabled in Admin Config and have an HTTPS webhook URL.
The optional bearer token is read from
`{PROVIDER}_LEAD_WEBHOOK_TOKEN`, such as `SALESFORCE_LEAD_WEBHOOK_TOKEN`.

## Environment

```text
LEAD_INTEGRATION_API_KEY=<strong random shared key>
SALESFORCE_LEAD_WEBHOOK_TOKEN=<optional provider token>
PITCHBOOK_LEAD_WEBHOOK_TOKEN=<optional provider token>
DNB_LEAD_WEBHOOK_TOKEN=<optional provider token>
HUBSPOT_LEAD_WEBHOOK_TOKEN=<optional provider token>
MARKETO_LEAD_WEBHOOK_TOKEN=<optional provider token>
MARKETING_LEAD_WEBHOOK_TOKEN=<optional provider token>
```
