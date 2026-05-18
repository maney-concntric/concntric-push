const express = require('express');
const { getDb } = require('../db/database');
const { requireFacilitatorOrAdmin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const ALLOWED_KEYS = ['show_scorecard', 'show_thematic_goal', 'show_parking_lot'];

// GET /api/settings
router.get('/', requireFacilitatorOrAdmin, (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM settings WHERE key IN (?, ?, ?)')
    .all(...ALLOWED_KEYS);
  const result = {};
  for (const row of rows) result[row.key] = row.value === 'true';
  res.json(result);
});

// PUT /api/settings — admin only
router.put('/', requireAdmin, (req, res) => {
  const db = getDb();
  const update = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const updateAll = db.transaction(() => {
    for (const key of ALLOWED_KEYS) {
      if (key in req.body) update.run(key, req.body[key] ? 'true' : 'false');
    }
  });
  updateAll();
  res.json({ success: true });
});

module.exports = router;
