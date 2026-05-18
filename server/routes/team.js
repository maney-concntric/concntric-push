const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/team — all active team members
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  const members = db.prepare(
    'SELECT * FROM team_members WHERE is_active = 1 ORDER BY sort_order ASC, name ASC'
  ).all();
  res.json(members);
});

// POST /api/team — admin: add member
router.post('/', requireAdmin, (req, res) => {
  const { name, role } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'Name and role required' });

  const db = getDb();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM team_members').get().m || 0;
  const id = uuidv4();
  db.prepare(`
    INSERT INTO team_members (id, name, role, sort_order, created_at, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(id, name.trim(), role.trim(), maxOrder + 1, new Date().toISOString());

  res.json({ id, name: name.trim(), role: role.trim(), sort_order: maxOrder + 1, is_active: 1 });
});

// PATCH /api/team/:id — admin: update member
router.patch('/:id', requireAdmin, (req, res) => {
  const { name, role, sort_order } = req.body;
  const db = getDb();
  const member = db.prepare('SELECT * FROM team_members WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Team member not found' });

  db.prepare(`
    UPDATE team_members SET
      name = ?, role = ?, sort_order = ?
    WHERE id = ?
  `).run(
    name ?? member.name,
    role ?? member.role,
    sort_order ?? member.sort_order,
    req.params.id
  );

  res.json({ success: true });
});

// DELETE /api/team/:id — admin: soft delete
router.delete('/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const result = db.prepare('UPDATE team_members SET is_active = 0 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Team member not found' });
  res.json({ success: true });
});

module.exports = router;
