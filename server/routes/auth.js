const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user, expiresIn = '8h') {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email.toLowerCase().trim());

  if (!user || !user.password_hash) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  db.prepare('UPDATE users SET last_login = ? WHERE id = ?').run(new Date().toISOString(), user.id);

  const token = signToken(user);
  const refresh = signToken(user, '24h');

  res.json({
    token,
    refreshToken: refresh,
    user: { id: user.id, email: user.email, role: user.role, name: user.name }
  });
});

// POST /api/auth/refresh
router.post('/refresh', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'User not found' });

  const token = signToken(user);
  const refresh = signToken(user, '24h');
  res.json({ token, refreshToken: refresh });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, role, name, last_login FROM users WHERE id = ? AND is_active = 1').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json(user);
});

// GET /api/auth/invite/:token — validate invite token
router.get('/invite/:token', (req, res) => {
  const db = getDb();
  const user = db.prepare(`
    SELECT id, email, name FROM users
    WHERE invite_token = ? AND invite_used = 0 AND invite_expires_at > ?
  `).get(req.params.token, new Date().toISOString());

  if (!user) return res.status(404).json({ error: 'Invalid or expired invite link' });
  res.json({ email: user.email, name: user.name });
});

// POST /api/auth/invite/:token/accept
router.post('/invite/:token/accept', async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 10) {
    return res.status(400).json({ error: 'Password must be at least 10 characters' });
  }

  const db = getDb();
  const user = db.prepare(`
    SELECT * FROM users
    WHERE invite_token = ? AND invite_used = 0 AND invite_expires_at > ?
  `).get(req.params.token, new Date().toISOString());

  if (!user) return res.status(404).json({ error: 'Invalid or expired invite link' });

  const hash = await bcrypt.hash(password, 12);
  db.prepare(`
    UPDATE users SET password_hash = ?, invite_used = 1, invite_token = NULL WHERE id = ?
  `).run(hash, user.id);

  const token = signToken(user);
  const refresh = signToken(user, '24h');
  res.json({
    token,
    refreshToken: refresh,
    user: { id: user.id, email: user.email, role: user.role, name: user.name }
  });
});

module.exports = router;
