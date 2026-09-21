const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

function getTeamsWithItems(db) {
  const teams = db.prepare('SELECT * FROM olt_teams WHERE is_active = 1 ORDER BY sort_order ASC').all();
  for (const team of teams) {
    team.items = db.prepare(
      'SELECT * FROM olt_template_items WHERE team_id = ? AND is_active = 1 ORDER BY sort_order ASC'
    ).all(team.id);
  }
  return teams;
}

// GET /api/olt/teams
router.get('/teams', requireAuth, (req, res) => {
  const db = getDb();
  res.json(getTeamsWithItems(db));
});

// POST /api/olt/teams (admin only)
router.post('/teams', requireAdmin, (req, res) => {
  const db = getDb();
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM olt_teams').get();
  const sort_order = (maxOrder.m ?? -1) + 1;
  const id = uuidv4();
  db.prepare(
    'INSERT INTO olt_teams (id, name, owner, sort_order, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)'
  ).run(id, name.trim(), '', sort_order, new Date().toISOString());
  res.json(db.prepare('SELECT * FROM olt_teams WHERE id = ?').get(id));
});

// PATCH /api/olt/teams/:id (admin only)
router.patch('/teams/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const team = db.prepare('SELECT * FROM olt_teams WHERE id = ?').get(req.params.id);
  if (!team) return res.status(404).json({ error: 'Not found' });
  const name = req.body.name ?? team.name;
  db.prepare('UPDATE olt_teams SET name = ? WHERE id = ?').run(name, req.params.id);
  res.json({ success: true });
});

// DELETE /api/olt/teams/:id (admin only)
router.delete('/teams/:id', requireAdmin, (req, res) => {
  const db = getDb();
  db.transaction(() => {
    db.prepare('DELETE FROM olt_template_items WHERE team_id = ?').run(req.params.id);
    db.prepare('DELETE FROM olt_teams WHERE id = ?').run(req.params.id);
  })();
  res.json({ success: true });
});

// POST /api/olt/teams/:teamId/items (admin only)
router.post('/teams/:teamId/items', requireAdmin, (req, res) => {
  const db = getDb();
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text required' });
  const maxOrder = db.prepare(
    'SELECT MAX(sort_order) as m FROM olt_template_items WHERE team_id = ?'
  ).get(req.params.teamId);
  const sort_order = (maxOrder.m ?? -1) + 1;
  const id = uuidv4();
  db.prepare(
    'INSERT INTO olt_template_items (id, team_id, text, sort_order, is_active) VALUES (?, ?, ?, ?, 1)'
  ).run(id, req.params.teamId, text.trim(), sort_order);
  res.json(db.prepare('SELECT * FROM olt_template_items WHERE id = ?').get(id));
});

// PATCH /api/olt/teams/:teamId/items/:itemId (admin only)
router.patch('/teams/:teamId/items/:itemId', requireAdmin, (req, res) => {
  const db = getDb();
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ error: 'Text required' });
  db.prepare('UPDATE olt_template_items SET text = ? WHERE id = ? AND team_id = ?').run(
    text.trim(), req.params.itemId, req.params.teamId
  );
  res.json({ success: true });
});

// DELETE /api/olt/teams/:teamId/items/:itemId (admin only)
router.delete('/teams/:teamId/items/:itemId', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM olt_template_items WHERE id = ? AND team_id = ?').run(
    req.params.itemId, req.params.teamId
  );
  res.json({ success: true });
});

module.exports = router;
