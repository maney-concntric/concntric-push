const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function buildDefaultSections(teamMembers) {
  const leaders = teamMembers.map(m => ({
    id: m.id,
    name: m.name,
    role: m.role,
    priorities: ['', '', ''],
    risks: '',
  }));

  const scorecardRows = [
    { id: uuidv4(), metric: 'ARR / Revenue', owner: '', target: '', actual: '', status: 'on_track', comment: '' },
    { id: uuidv4(), metric: 'Pipeline Coverage', owner: '', target: '', actual: '', status: 'on_track', comment: '' },
    { id: uuidv4(), metric: 'New Logos / Expansions', owner: '', target: '', actual: '', status: 'on_track', comment: '' },
    { id: uuidv4(), metric: 'Forecast Accuracy', owner: '', target: '', actual: '', status: 'on_track', comment: '' },
    { id: uuidv4(), metric: 'Product Delivery Milestone', owner: '', target: '', actual: '', status: 'on_track', comment: '' },
    { id: uuidv4(), metric: 'Retention / NRR / Churn', owner: '', target: '', actual: '', status: 'on_track', comment: '' },
    { id: uuidv4(), metric: 'Cash / Burn / Runway', owner: '', target: '', actual: '', status: 'on_track', comment: '' },
  ];

  return {
    lightning_round: { leaders, timerStarted: null, timerElapsed: 0 },
    scorecard: { rows: scorecardRows, timerStarted: null, timerElapsed: 0 },
    thematic_goal: { goal: '', objectives: [], timerStarted: null, timerElapsed: 0 },
    realtime_agenda: { items: [], timerStarted: null, timerElapsed: 0 },
    tactical_discussion: { items: [], timerStarted: null, timerElapsed: 0 },
    parking_lot: {
      items: [
        { id: uuidv4(), text: 'Pricing strategy' },
        { id: uuidv4(), text: 'Org design / hiring plan' },
        { id: uuidv4(), text: 'Product roadmap tradeoffs' },
      ],
      timerStarted: null,
      timerElapsed: 0,
    },
    action_items: { items: [], timerStarted: null, timerElapsed: 0 },
    cascading_messages: {
      leaders: teamMembers.map(m => ({ id: m.id, name: m.name, role: m.role, message: '' })),
      timerStarted: null,
      timerElapsed: 0,
    },
  };
}

// GET /api/meetings
router.get('/', requireAuth, (req, res) => {
  const db = getDb();
  let meetings;
  if (req.user.role === 'admin' || req.user.role === 'facilitator') {
    meetings = db.prepare(`
      SELECT m.*, u.name as creator_name
      FROM meetings m
      LEFT JOIN users u ON u.id = m.created_by
      ORDER BY m.date DESC, m.created_at DESC
    `).all();
  } else {
    // participant: only assigned meetings
    meetings = db.prepare(`
      SELECT m.*, u.name as creator_name
      FROM meetings m
      LEFT JOIN users u ON u.id = m.created_by
      JOIN meetings_participants mp ON mp.meeting_id = m.id AND mp.user_id = ?
      ORDER BY m.date DESC, m.created_at DESC
    `).all(req.user.id);
  }
  res.json(meetings);
});

// POST /api/meetings — create new meeting (admin or facilitator only)
router.post('/', requireAuth, (req, res) => {
  if (req.user.role === 'participant') {
    return res.status(403).json({ error: 'Participants cannot create meetings' });
  }
  const db = getDb();
  const { facilitator, date: bodyDate } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  const date = bodyDate || now.slice(0, 10);

  const settingRows = db.prepare(
    'SELECT key, value FROM settings WHERE key IN (?, ?, ?)'
  ).all('show_scorecard', 'show_thematic_goal', 'show_parking_lot');
  const meetingSettings = {};
  for (const row of settingRows) meetingSettings[row.key] = row.value === 'true';

  db.prepare(`
    INSERT INTO meetings (id, date, facilitator, created_by, created_at, is_complete, meeting_settings)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(id, date, facilitator || req.user.name, req.user.id, now, JSON.stringify(meetingSettings));

  const teamMembers = db.prepare('SELECT * FROM team_members WHERE is_active = 1 ORDER BY sort_order ASC').all();
  const defaults = buildDefaultSections(teamMembers);

  const insertSection = db.prepare(`
    INSERT INTO meeting_sections (id, meeting_id, section_key, data, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAll = db.transaction(() => {
    for (const [key, data] of Object.entries(defaults)) {
      insertSection.run(uuidv4(), id, key, JSON.stringify(data), now);
    }
  });
  insertAll();

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id);
  res.json(meeting);
});

function canAccessMeeting(db, meeting, user) {
  if (user.role === 'admin' || user.role === 'facilitator') return true;
  if (user.role === 'participant') {
    const assigned = db.prepare(
      'SELECT 1 FROM meetings_participants WHERE meeting_id = ? AND user_id = ?'
    ).get(meeting.id, user.id);
    return !!assigned;
  }
  return false;
}

// GET /api/meetings/:id
router.get('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  if (!canAccessMeeting(db, meeting, req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sections = db.prepare('SELECT section_key, data, updated_at FROM meeting_sections WHERE meeting_id = ?').all(req.params.id);
  const sectionMap = {};
  for (const s of sections) {
    sectionMap[s.section_key] = JSON.parse(s.data);
  }

  res.json({ ...meeting, sections: sectionMap });
});

// PUT /api/meetings/:id/sections/:key — save section data
router.put('/:id/sections/:key', requireAuth, (req, res) => {
  const db = getDb();
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  if (!canAccessMeeting(db, meeting, req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO meeting_sections (id, meeting_id, section_key, data, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(meeting_id, section_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
  `).run(uuidv4(), req.params.id, req.params.key, JSON.stringify(req.body), now);

  res.json({ success: true, updated_at: now });
});

// PATCH /api/meetings/:id/complete
router.patch('/:id/complete', requireAuth, (req, res) => {
  const db = getDb();
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  if (!canAccessMeeting(db, meeting, req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  db.prepare('UPDATE meetings SET is_complete = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// DELETE /api/meetings/:id — admin only
router.delete('/:id', requireAuth, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const db = getDb();
  const meeting = db.prepare('SELECT id FROM meetings WHERE id = ?').get(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
  db.transaction(() => {
    db.prepare('DELETE FROM meeting_sections WHERE meeting_id = ?').run(req.params.id);
    db.prepare('DELETE FROM meetings WHERE id = ?').run(req.params.id);
  })();
  res.json({ success: true });
});

// PATCH /api/meetings/:id — update facilitator
router.patch('/:id', requireAuth, (req, res) => {
  const db = getDb();
  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

  if (!canAccessMeeting(db, meeting, req.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { facilitator } = req.body;
  if (facilitator !== undefined) {
    db.prepare('UPDATE meetings SET facilitator = ? WHERE id = ?').run(facilitator, req.params.id);
  }
  res.json({ success: true });
});

module.exports = router;
