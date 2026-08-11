import { db } from '../db.js';
import { dispatchRaw } from './email.js';

const DAY = 24 * 60 * 60 * 1000;

export async function runProposalFeedbackReminders(now = Date.now()) {
  const rows = await db.prepare(`
    SELECT DISTINCT pv.id AS version_id,pv.version_number,pc.user_id,u.email
    FROM proposal_versions pv
    JOIN proposal_collaborators pc ON pc.proposal_version_id=pv.id
    JOIN users u ON u.id=pc.user_id
    WHERE pv.status='delivered' AND pv.delivered_at <= $1
      AND NOT EXISTS (SELECT 1 FROM proposal_feedback_entries pfe WHERE pfe.proposal_version_id=pv.id AND pfe.user_id=pc.user_id AND pfe.status IN ('published','triaged','resolved'))
      AND NOT EXISTS (SELECT 1 FROM proposal_feedback_reminders pfr WHERE pfr.proposal_version_id=pv.id AND pfr.user_id=pc.user_id AND pfr.reminder_at > $2)
  `).all(now - DAY, now - DAY);
  for (const row of rows) {
    const emails = await db.prepare(`SELECT email FROM user_emails WHERE user_id=$1 AND verified=true AND type IN ('primary','personal','work','organization')`).all(row.user_id);
    const targets = new Set([row.email, ...emails.map((item) => item.email)]);
    for (const email of targets) await dispatchRaw({ to: email, subject: `Finish your proposal feedback · version ${row.version_number}`, text: 'No feedback has been published for this delivered proposal. Sign in to add, review, and publish it when ready.', html: '<p>No feedback has been published for this delivered proposal.</p><p><a href="https://saltbasin.net/member?workspace=1&tab=proposal-experience">Review your proposal feedback</a></p>' });
    await db.prepare(`INSERT INTO notifications (user_id,source_type,source_id,title,body,severity,action_url,created_at) VALUES ($1,'proposal_feedback_reminder',$2,'Finish your proposal feedback','No feedback has been published yet. Add or review feedback and publish it when ready.','info','/member?workspace=1&tab=proposal-experience',$3)`).run(row.user_id, row.version_id, now);
    await db.prepare(`INSERT INTO proposal_feedback_reminders (proposal_version_id,user_id,reminder_at,channel_summary) VALUES ($1,$2,$3,$4)`).run(row.version_id, row.user_id, now, { emailCount: targets.size, platformNotification: true });
  }
  return { reminded: rows.length };
}

export async function runProposalFeedbackTriage(now = Date.now()) {
  const rows = await db.prepare(`SELECT id,entry_type,body,context FROM proposal_feedback_entries WHERE status='published'`).all();
  for (const row of rows) {
    const body = String(row.body || '');
    const urgency = /urgent|asap|deadline|block/i.test(body) ? 'high' : 'normal';
    const nextAction = row.entry_type === 'question' || body.includes('?') ? 'draft_response' : row.entry_type === 'change_request' ? 'review_proposal_revision' : 'review_comment';
    await db.prepare(`UPDATE proposal_feedback_entries SET status='triaged',triage=$1,updated_at=$2 WHERE id=$3 AND status='published'`).run({ urgency, nextAction, summary: body.slice(0, 240), estimatedBy: 'proposal-feedback-triage-v1', requiresConfiguratorReview: true }, now, row.id);
  }
  return { triaged: rows.length };
}
