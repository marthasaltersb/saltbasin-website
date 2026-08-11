import 'dotenv/config';
import { db } from '../db.js';

const email = 'saltbasin-networks@breckgolden.com';
const user = await db.prepare(`SELECT id FROM users WHERE email=$1`).get(email);
if (!user) throw new Error(`Breck user ${email} does not exist; existing-user bypass cannot be provisioned.`);
const lead = await db.prepare(`SELECT id FROM leads WHERE converted_user_id=$1 OR lower(email)=$2 ORDER BY updated_at DESC LIMIT 1`).get(user.id, email);
const org = await db.prepare(`SELECT id FROM organization_profiles WHERE lower(name) LIKE '%lonetree%' OR email_domain='lonetreecapital.com' ORDER BY id LIMIT 1`).get();
const template = await db.prepare(`SELECT id FROM client_basin_templates WHERE template_key='private-markets-portfolio-company'`).get();
let journey = await db.prepare(`SELECT id FROM revenue_journeys WHERE source_user_id=$1 AND lower(name)='lonetree revenue journey' ORDER BY id LIMIT 1`).get(user.id);
const now = Date.now();
if (!journey) {
  const result = await db.prepare(`INSERT INTO revenue_journeys (org_id,template_id,source_user_id,source_lead_id,name,channel_type,current_stage,metadata,created_at,updated_at) VALUES ($1,$2,$3,$4,'LoneTree Revenue Journey','Revenue','proposal',$5,$6,$6) RETURNING id`).run(org?.id || null, template?.id || null, user.id, lead?.id || null, { emailRequirementsBypassed: true, bypassReason: 'Explicit existing-user exception for Breck Golden', sourceWorld: 'career', proposalExperience: 'lonetree' }, now);
  journey = { id: Number(result.lastInsertRowid) };
}
await db.prepare(`INSERT INTO revenue_journey_contacts (journey_id,user_id,contact_order,opportunity_role,metadata,created_at) VALUES ($1,$2,1,'originating_contact',$3,$4) ON CONFLICT (journey_id,user_id) DO UPDATE SET contact_order=1,opportunity_role='originating_contact',metadata=EXCLUDED.metadata`).run(journey.id, user.id, { firstContact: true, sourceInteraction: 'career_to_proposal_inquiry' }, now);
console.log(JSON.stringify({ ok: true, journeyId: Number(journey.id), userId: Number(user.id), stage: 'proposal', channelType: 'Revenue' }));
