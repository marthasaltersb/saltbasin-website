import { db } from './server/db.js';
import { promoteLeadToOrganizationLead } from './server/lib/journeyRods.js';

const { leadId, publicId, rod } = await promoteLeadToOrganizationLead(null, {
  orgSignalSource: 'bestystaff-conversion-intent-TEST',
  emailDomain: 'example-test-corp.com',
  sourceEmail: 'someone@example-test-corp.com',
});
console.log('leadId:', leadId, 'publicId:', publicId, 'rod.id:', rod?.id, 'rod.rod_type:', rod?.rod_type);

const lead = await db.prepare(`SELECT id, lead_type, originating_member_user_id, name FROM leads WHERE id=$1`).get(leadId);
console.log('lead row:', JSON.stringify(lead));

const rodRow = await db.prepare(`SELECT id, rod_type, lead_id, metadata FROM journey_data_rods WHERE id=$1`).get(rod.id);
console.log('rod row:', JSON.stringify(rodRow));

process.exit(0);
