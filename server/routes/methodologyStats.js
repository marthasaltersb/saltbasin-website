// Safe, non-admin-gated aggregate figures for /output/methodology (the
// client/member-facing Contribution Intelligence Methodology IP page).
//
// backlog.js's whole router is requireAdmin — correctly, since it exposes
// full requirement text, business rules, etc. This route exposes ONLY
// the platform-wide numeric totals (hours, cost, savings multiple) that
// the methodology page needs to stay honest, gated at requireUser (any
// logged-in member, not just admin) so the page can show real numbers
// to members too, not just Betsy.

import { Router } from 'express';
import { db } from '../db.js';
import { requireUser } from '../auth.js';

const router = Router();

router.get('/summary', requireUser, async (req, res) => {
  const items = (await db.prepare(`SELECT * FROM backlog_items WHERE status != 'archived'`).all());
  const delivered = items.filter((it) => it.status === 'deployed' || it.status === 'completed');

  const hoursClaude = delivered.reduce((s, it) => s + Number(it.hours_claude || 0), 0);
  const hoursBetsy = delivered.reduce((s, it) => s + Number(it.hours_betsy || 0), 0);
  const costUsdClaude = delivered.reduce((s, it) => s + Number(it.cost_usd_claude || 0), 0);
  const traditionalCostUsd = delivered.reduce((s, it) => s + Number(it.traditional_cost_usd || 0), 0);
  const hoursTotal = hoursClaude + hoursBetsy;
  const aiSavingsUsd = traditionalCostUsd - costUsdClaude;
  const aiSavingsMultiple = costUsdClaude > 0 ? Math.round((traditionalCostUsd / costUsdClaude) * 10) / 10 : null;

  res.json({
    requirementsDelivered: delivered.length,
    hoursClaude: Math.round(hoursClaude * 10) / 10,
    hoursBetsy: Math.round(hoursBetsy * 10) / 10,
    hoursTotal: Math.round(hoursTotal * 10) / 10,
    costUsdClaude: Math.round(costUsdClaude * 100) / 100,
    traditionalCostUsd: Math.round(traditionalCostUsd * 100) / 100,
    aiSavingsUsd: Math.round(aiSavingsUsd * 100) / 100,
    aiSavingsMultiple,
  });
});

export default router;
