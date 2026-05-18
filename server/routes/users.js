const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { requireAdmin, requireAuth } = require('../middleware/auth');

const router = express.Router();

const VALID_ROLES = ['admin', 'facilitator', 'participant'];

// GET /api/users — admin: all users; others: just self
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  if (req.user.role === 'admin') {
    const users = db.prepare(`
      SELECT id, email, name, role, is_active, created_at, last_login, invite_used
      FROM users ORDER BY created_at ASC
    `).all();
    return res.json(users);
  }
  const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(req.user.id);
  res.json([user]);
});

// GET /api/users/stats — admin only
router.get('/stats', requireAdmin, (req, res) => {
  const db = getDb();
  const totalUsers = db.prepare('SELECT COUNT(*) as c FROM users WHERE is_active = 1').get().c;
  const totalMeetings = db.prepare('SELECT COUNT(*) as c FROM meetings').get().c;
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const meetingsThisMonth = db.prepare(
    'SELECT COUNT(*) as c FROM meetings WHERE created_at >= ?'
  ).get(monthStart.toISOString()).c;
  res.json({ totalUsers, totalMeetings, meetingsThisMonth });
});

// POST /api/users/invite — admin only
router.post('/invite', requireAdmin, (req, res) => {
  const { email, name, role = 'facilitator' } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Email and name required' });
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(409).json({ error: 'A user with that email already exists' });

  const token = uuidv4().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT INTO users (id, email, name, role, created_at, is_active, invite_token, invite_used, invite_expires_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, 0, ?)
  `).run(uuidv4(), email.toLowerCase().trim(), name.trim(), role, new Date().toISOString(), token, expiresAt);

  const inviteUrl = `${process.env.ALLOWED_ORIGIN || 'http://localhost:5173'}/accept-invite/${token}`;
  res.json({ inviteUrl, expiresAt });
});

// PATCH /api/users/:id/role — admin only, cannot change own role
router.patch('/:id/role', requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot change your own role' });
  }
  const { role } = req.body;
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Invalid role' });

  const db = getDb();
  const result = db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true });
});

// DELETE /api/users/:id — admin only, no self-deletion
router.delete('/:id', requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }
  const db = getDb();
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.transaction(() => {
    db.prepare('DELETE FROM meetings_participants WHERE user_id = ?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  })();

  res.json({ success: true });
});

// PATCH /api/users/:id/deactivate — admin only
router.patch('/:id/deactivate', requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot deactivate your own account' });
  }
  const db = getDb();
  const result = db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true });
});

// PATCH /api/users/:id/reactivate — admin only
router.patch('/:id/reactivate', requireAdmin, (req, res) => {
  const db = getDb();
  const result = db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true });
});

// GET /api/users/:id/meetings — admin only: meetings assigned to a participant
router.get('/:id/meetings', requireAdmin, (req, res) => {
  const db = getDb();
  const meetings = db.prepare(`
    SELECT m.id, m.date, m.facilitator, m.is_complete
    FROM meetings m
    JOIN meetings_participants mp ON mp.meeting_id = m.id
    WHERE mp.user_id = ?
    ORDER BY m.date DESC
  `).all(req.params.id);
  res.json(meetings);
});

// POST /api/users/:id/meetings/:meetingId — admin only: assign meeting to participant
router.post('/:id/meetings/:meetingId', requireAdmin, (req, res) => {
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO meetings_participants (id, meeting_id, user_id, assigned_at)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), req.params.meetingId, req.params.id, new Date().toISOString());
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.json({ success: true }); // already assigned
    throw e;
  }
  res.json({ success: true });
});

// DELETE /api/users/:id/meetings/:meetingId — admin only: unassign meeting from participant
router.delete('/:id/meetings/:meetingId', requireAdmin, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM meetings_participants WHERE meeting_id = ? AND user_id = ?')
    .run(req.params.meetingId, req.params.id);
  res.json({ success: true });
});

module.exports = router;
