# Environment variable names

> **GENERATED** by `scripts/baseline/generate-inventory.mjs` — do not edit by hand.
> Revision `e0ea466` (`claude/compassionate-wozniak-7vx4jr`, committed 2026-09-22T10:55:17-04:00). Evidence class: **static extraction from source** — establishes declaration, not working behavior.


Names and reference locations only — **no values are read or recorded**. 78 distinct names.

| Element ID | Name | Kind of reference | In .env.example | References (first 4) | Ref count |
|---|---|---|---|---|---|
| TE-ENV-ADMIN_EMAIL | `ADMIN_EMAIL` | declared in .env.example, declared in render.yaml, server/process.env | yes | `.env.example:8` `render.yaml:34` `scripts/add-audit-backlog-items.mjs:15` `scripts/add-cicd-promotion-backlog-item.mjs:37` | 41 |
| TE-ENV-ADMIN_INITIAL_PASSWORD | `ADMIN_INITIAL_PASSWORD` | declared in .env.example, declared in render.yaml, server/process.env | yes | `.env.example:9` `render.yaml:36` `scripts/add-audit-backlog-items.mjs:16` `scripts/add-cicd-promotion-backlog-item.mjs:38` | 35 |
| TE-ENV-ADMIN_PHONE | `ADMIN_PHONE` | server/process.env | no | `server/routes/bestyStaff.js:455` | 1 |
| TE-ENV-ANTHROPIC_API_KEY | `ANTHROPIC_API_KEY` | declared in .env.example, declared in render.yaml, server/process.env | yes | `.env.example:2` `render.yaml:39` `server/lib/agents/codeReviewAgent.js:144` `server/lib/backlogHistoryReconciler.js:30` | 15 |
| TE-ENV-APP_BASE_URL | `APP_BASE_URL` | server/process.env | no | `scripts/apply-website-intelligence-draft.mjs:4` `scripts/apply-website-intelligence-draft.mjs:4` `server/lib/oauthProviders.js:22` `server/routes/auth.js:32` | 9 |
| TE-ENV-BACKLOG_RECONCILIATION_ANTHROPIC_MODEL | `BACKLOG_RECONCILIATION_ANTHROPIC_MODEL` | server/process.env | no | `server/lib/backlogHistoryReconciler.js:31` | 1 |
| TE-ENV-BACKLOG_RECONCILIATION_OPENAI_MODEL | `BACKLOG_RECONCILIATION_OPENAI_MODEL` | server/process.env | no | `server/lib/backlogHistoryReconciler.js:25` | 1 |
| TE-ENV-BREVO_API_KEY | `BREVO_API_KEY` | server/process.env | no | `scripts/push-brevo-key-to-render.mjs:13` `server/lib/email.js:21` `server/lib/email.js:112` `server/routes/config.js:160` | 4 |
| TE-ENV-CAREER_RETENTION_WORKER_ENABLED | `CAREER_RETENTION_WORKER_ENABLED` | server/process.env | no | `server/lib/careerFileRetention.js:7` | 1 |
| TE-ENV-CLAUDE_CODE_BIN | `CLAUDE_CODE_BIN` | server/process.env | no | `server/lib/codeAgentRunner.js:30` | 1 |
| TE-ENV-CODEX_CLI_BIN | `CODEX_CLI_BIN` | server/process.env | no | `server/lib/codeAgentRunner.js:25` | 1 |
| TE-ENV-CODEX_HOME | `CODEX_HOME` | server/process.env | no | `scripts/run-codex-contribution-intelligence.mjs:16` | 1 |
| TE-ENV-CONTENT_ATTACHMENT_RETENTION_WORKER_ENABLED | `CONTENT_ATTACHMENT_RETENTION_WORKER_ENABLED` | server/process.env | no | `server/lib/contentAttachmentRetention.js:11` | 1 |
| TE-ENV-DATABASE_URL | `DATABASE_URL` | server/process.env | no | `scripts/rotate-admin-password.mjs:27` `server/db.js:44` | 2 |
| TE-ENV-DEALHUB_CLIENT_ID | `DEALHUB_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:207` | 1 |
| TE-ENV-DEALHUB_CLIENT_SECRET | `DEALHUB_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:208` | 1 |
| TE-ENV-DEV | `DEV` | client/import.meta.env | no | `src/components/PublicSite.jsx:17` `src/components/PublicSite.jsx:66` | 2 |
| TE-ENV-EMAIL_FROM | `EMAIL_FROM` | server/process.env | no | `server/lib/email.js:46` `server/lib/email.js:46` | 2 |
| TE-ENV-FRONTEND_ORIGIN | `FRONTEND_ORIGIN` | declared in render.yaml, server/process.env | no | `render.yaml:42` `server/index.js:117` | 2 |
| TE-ENV-GITHUB_ACTIONS_TOKEN | `GITHUB_ACTIONS_TOKEN` | server/process.env | no | `server/routes/deploymentIntelligence.js:64` | 1 |
| TE-ENV-GITHUB_DEPLOYMENT_WEBHOOK_SECRET | `GITHUB_DEPLOYMENT_WEBHOOK_SECRET` | server/process.env | no | `server/routes/deploymentIntelligence.js:14` | 1 |
| TE-ENV-GITHUB_OWNER | `GITHUB_OWNER` | server/process.env | no | `scripts/push-github-secrets.mjs:29` | 1 |
| TE-ENV-GITHUB_REPO | `GITHUB_REPO` | server/process.env | no | `scripts/push-github-secrets.mjs:30` | 1 |
| TE-ENV-GITHUB_REPOSITORY | `GITHUB_REPOSITORY` | server/process.env | no | `server/routes/deploymentIntelligence.js:65` | 1 |
| TE-ENV-GITHUB_TOKEN | `GITHUB_TOKEN` | actions secrets, server/process.env | no | `.github/workflows/render-deploy-monitor.yml:28` `.github/workflows/render-deploy-verify.yml:27` `.github/workflows/scheduled-production-promotion.yml:44` `scripts/push-github-secrets.mjs:28` | 4 |
| TE-ENV-HUBSPOT_CLIENT_ID | `HUBSPOT_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:247` | 1 |
| TE-ENV-HUBSPOT_CLIENT_SECRET | `HUBSPOT_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:248` | 1 |
| TE-ENV-IP_HASH_SALT | `IP_HASH_SALT` | server/process.env | no | `server/lib/audit.js:45` | 1 |
| TE-ENV-LEAD_INTEGRATION_API_KEY | `LEAD_INTEGRATION_API_KEY` | server/process.env | no | `server/routes/leadIntegrations.js:9` `server/routes/leadIntegrations.js:84` `server/routes/leads.js:377` `server/routes/leads.js:378` | 4 |
| TE-ENV-LINKEDIN_CLIENT_ID | `LINKEDIN_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:91` | 1 |
| TE-ENV-LINKEDIN_CLIENT_SECRET | `LINKEDIN_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:92` | 1 |
| TE-ENV-MARKETO_CLIENT_ID | `MARKETO_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:229` | 1 |
| TE-ENV-MARKETO_CLIENT_SECRET | `MARKETO_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:230` | 1 |
| TE-ENV-MICROSOFT_CLIENT_ID | `MICROSOFT_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:33` | 1 |
| TE-ENV-MICROSOFT_CLIENT_SECRET | `MICROSOFT_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:34` | 1 |
| TE-ENV-NETLIFY_BUILD_HOOK_URL | `NETLIFY_BUILD_HOOK_URL` | actions secrets | no | `.github/workflows/promote-production.yml:46` `.github/workflows/promote-production.yml:47` | 2 |
| TE-ENV-NODE_ENV | `NODE_ENV` | declared in render.yaml, server/process.env | no | `render.yaml:25` `server/auth.js:22` `server/auth.js:124` `server/index.js:93` | 8 |
| TE-ENV-NODE_VERSION | `NODE_VERSION` | declared in render.yaml | no | `render.yaml:27` | 1 |
| TE-ENV-OPENAI_API_KEY | `OPENAI_API_KEY` | server/process.env | no | `server/lib/backlogHistoryReconciler.js:24` `server/lib/backlogHistoryReconciler.js:25` `server/routes/agent.js:280` | 3 |
| TE-ENV-OPENAI_IMAGE_MODEL | `OPENAI_IMAGE_MODEL` | server/process.env | no | `server/routes/backlogOutputs.js:66` | 1 |
| TE-ENV-ORACLE_CLIENT_ID | `ORACLE_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:285` | 1 |
| TE-ENV-ORACLE_CLIENT_SECRET | `ORACLE_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:286` | 1 |
| TE-ENV-PORT | `PORT` | declared in .env.example, declared in render.yaml, server/process.env | yes | `.env.example:12` `render.yaml:29` `server/index.js:242` `server/routes/backlog.js:643` | 4 |
| TE-ENV-PRODUCTION_PROMOTION_WORKFLOW | `PRODUCTION_PROMOTION_WORKFLOW` | server/process.env | no | `server/routes/deploymentIntelligence.js:66` | 1 |
| TE-ENV-PROMOTION_AGENT_ENABLED | `PROMOTION_AGENT_ENABLED` | actions vars | no | `.github/workflows/scheduled-production-promotion.yml:47` | 1 |
| TE-ENV-PUBLIC_BASE_URL | `PUBLIC_BASE_URL` | server/process.env | no | `scripts/add-audit-backlog-items.mjs:14` `scripts/add-cicd-promotion-backlog-item.mjs:36` `scripts/add-configurable-platform-backlog-items.mjs:50` `scripts/add-phase-d-backlog-items.mjs:49` | 38 |
| TE-ENV-PUBLIC_MEMBER_SIGNUP_ENABLED | `PUBLIC_MEMBER_SIGNUP_ENABLED` | server/process.env | no | `server/routes/members.js:68` | 1 |
| TE-ENV-QUICKBOOKS_CLIENT_ID | `QUICKBOOKS_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:75` | 1 |
| TE-ENV-QUICKBOOKS_CLIENT_SECRET | `QUICKBOOKS_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:76` | 1 |
| TE-ENV-RECAPTCHA_MIN_SCORE | `RECAPTCHA_MIN_SCORE` | server/process.env | no | `server/lib/recaptcha.js:17` | 1 |
| TE-ENV-RECAPTCHA_SECRET_KEY | `RECAPTCHA_SECRET_KEY` | server/process.env | no | `server/lib/recaptcha.js:16` | 1 |
| TE-ENV-RENDER_API_KEY | `RENDER_API_KEY` | actions secrets, server/process.env | no | `.github/workflows/render-deploy-monitor.yml:26` `.github/workflows/render-deploy-verify.yml:25` `scripts/push-brevo-key-to-render.mjs:11` `scripts/push-supabase-env-to-render.mjs:34` | 6 |
| TE-ENV-RENDER_DEPLOY_HOOK_URL | `RENDER_DEPLOY_HOOK_URL` | actions secrets | no | `.github/workflows/promote-production.yml:43` `.github/workflows/promote-production.yml:44` | 2 |
| TE-ENV-RENDER_SERVICE_ID | `RENDER_SERVICE_ID` | actions secrets, server/process.env | no | `.github/workflows/render-deploy-monitor.yml:27` `.github/workflows/render-deploy-verify.yml:26` `scripts/push-brevo-key-to-render.mjs:12` `scripts/push-supabase-env-to-render.mjs:35` | 6 |
| TE-ENV-SALESFORCE_CLIENT_ID | `SALESFORCE_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:53` | 1 |
| TE-ENV-SALESFORCE_CLIENT_SECRET | `SALESFORCE_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:54` | 1 |
| TE-ENV-SAP_CLIENT_ID | `SAP_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:267` | 1 |
| TE-ENV-SAP_CLIENT_SECRET | `SAP_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:268` | 1 |
| TE-ENV-SESSION_SECRET | `SESSION_SECRET` | declared in .env.example, declared in render.yaml, server/process.env | yes | `.env.example:5` `render.yaml:32` `server/routes/analytics.js:20` | 3 |
| TE-ENV-SNOWFLAKE_CLIENT_ID | `SNOWFLAKE_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:154` | 1 |
| TE-ENV-SNOWFLAKE_CLIENT_SECRET | `SNOWFLAKE_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:155` | 1 |
| TE-ENV-SQUARE_PLEDGE_PAYMENT_URL | `SQUARE_PLEDGE_PAYMENT_URL` | server/process.env | no | `server/routes/leads.js:655` | 1 |
| TE-ENV-STRIPE_SECRET_KEY | `STRIPE_SECRET_KEY` | server/process.env | no | `server/routes/commerce.js:27` `server/routes/commerce.js:218` | 2 |
| TE-ENV-STRIPE_WEBHOOK_SECRET | `STRIPE_WEBHOOK_SECRET` | server/process.env | no | `server/routes/commerce.js:248` `server/routes/commerce.js:254` | 2 |
| TE-ENV-SUPABASE_CLIENT_ID | `SUPABASE_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:114` | 1 |
| TE-ENV-SUPABASE_CLIENT_SECRET | `SUPABASE_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:115` | 1 |
| TE-ENV-SUPABASE_SERVICE_ROLE_KEY | `SUPABASE_SERVICE_ROLE_KEY` | server/process.env | no | `server/lib/careerFileRetention.js:9` `server/lib/contentAttachmentRetention.js:13` `server/routes/careerMaster.js:82` `server/routes/contentAttachments.js:28` | 6 |
| TE-ENV-SUPABASE_URL | `SUPABASE_URL` | server/process.env | no | `server/lib/careerFileRetention.js:8` `server/lib/contentAttachmentRetention.js:12` `server/routes/careerMaster.js:81` `server/routes/contentAttachments.js:27` | 6 |
| TE-ENV-TABLEAU_CLIENT_ID | `TABLEAU_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:172` | 1 |
| TE-ENV-TABLEAU_CLIENT_SECRET | `TABLEAU_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:173` | 1 |
| TE-ENV-TOKEN_ENCRYPTION_KEY | `TOKEN_ENCRYPTION_KEY` | server/process.env | no | `server/lib/crypto.js:3` | 1 |
| TE-ENV-VERIFY_BASE_URL | `VERIFY_BASE_URL` | server/process.env | no | `scripts/verify-besty-auth-proposal.mjs:47` | 1 |
| TE-ENV-VITE_RECAPTCHA_SITE_KEY | `VITE_RECAPTCHA_SITE_KEY` | client/import.meta.env | no | `src/lib/recaptcha.js:10` | 1 |
| TE-ENV-VITE_TEST_BASE_URL | `VITE_TEST_BASE_URL` | actions vars, client/import.meta.env | no | `.github/workflows/promote-production.yml:41` `src/components/admin/TestLoginRedirect.jsx:4` | 2 |
| TE-ENV-WORKDAY_CLIENT_ID | `WORKDAY_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:136` | 1 |
| TE-ENV-WORKDAY_CLIENT_SECRET | `WORKDAY_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:137` | 1 |
| TE-ENV-ZUORA_CLIENT_ID | `ZUORA_CLIENT_ID` | server/process.env | no | `server/lib/oauthProviders.js:190` | 1 |
| TE-ENV-ZUORA_CLIENT_SECRET | `ZUORA_CLIENT_SECRET` | server/process.env | no | `server/lib/oauthProviders.js:191` | 1 |


Dynamically constructed names (OAuth providers, `server/lib/oauthProviders.js`) are not visible to static extraction beyond what's listed; see the OAuth module spec.
