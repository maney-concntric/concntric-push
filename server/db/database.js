const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/meetings.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      role TEXT NOT NULL DEFAULT 'member',
      name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      invite_token TEXT,
      invite_used INTEGER NOT NULL DEFAULT 0,
      invite_expires_at TEXT,
      last_login TEXT
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      facilitator TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_complete INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS meeting_sections (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL,
      section_key TEXT NOT NULL,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      UNIQUE(meeting_id, section_key)
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meetings_participants (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      assigned_at TEXT NOT NULL,
      FOREIGN KEY (meeting_id) REFERENCES meetings(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(meeting_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS olt_teams (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      owner TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS olt_template_items (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (team_id) REFERENCES olt_teams(id)
    );
  `);

  // Non-destructive migrations
  try { db.exec('ALTER TABLE meetings ADD COLUMN meeting_settings TEXT'); } catch (_) {}
  try { db.exec("ALTER TABLE meetings ADD COLUMN meeting_type TEXT NOT NULL DEFAULT 'slt'"); } catch (_) {}
  try { db.exec("ALTER TABLE users ADD COLUMN meeting_access TEXT NOT NULL DEFAULT 'both'"); } catch (_) {}

  // Migrate legacy "member" role to "facilitator"
  db.prepare("UPDATE users SET role = 'facilitator' WHERE role = 'member'").run();

  seedAdmin();
  seedTeam();
  seedSettings();
  seedOltTeams();
}

function seedAdmin() {
  const db = getDb();
  const adminEmail = process.env.ADMIN_EMAIL || 'maney@concntric.com';
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  if (existing) return;

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('⚠️  ADMIN_PASSWORD env var not set. Admin account not created.');
    console.error('   Set ADMIN_PASSWORD in your .env file and restart.');
    return;
  }
  if (adminPassword.length < 10) {
    console.error('⚠️  ADMIN_PASSWORD must be at least 10 characters.');
    return;
  }

  const hash = bcrypt.hashSync(adminPassword, 12);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, created_at, is_active, invite_used)
    VALUES (?, ?, ?, 'admin', ?, ?, 1, 1)
  `).run(uuidv4(), adminEmail, hash, process.env.ADMIN_NAME || 'Admin', new Date().toISOString());

  console.log(`✅ Admin account created: ${adminEmail}`);
}

function seedTeam() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM team_members').get();
  if (count.c > 0) return;

  const defaults = [
    { name: 'Steve', role: 'CEO' },
    { name: 'Sales', role: 'Sales Lead' },
    { name: 'Marketing', role: 'Marketing Lead' },
    { name: 'Product', role: 'Product Lead' },
    { name: 'CS/Ops', role: 'CS & Operations Lead' },
    { name: 'Finance', role: 'Finance Lead' },
  ];

  const insert = db.prepare(`
    INSERT INTO team_members (id, name, role, sort_order, created_at, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  defaults.forEach((m, i) => insert.run(uuidv4(), m.name, m.role, i, new Date().toISOString()));
  console.log('✅ Default team members seeded');
}

function seedSettings() {
  const db = getDb();
  const defaults = {
    show_scorecard: 'true',
    show_thematic_goal: 'true',
    show_parking_lot: 'true',
  };
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(defaults)) insert.run(k, v);
}

function seedOltTeams() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM olt_teams').get();
  if (count.c > 0) return;

  const teams = [
    { name: 'GTM Team', owner: 'Connor + Maddie', items: [
      'Hubspot (Source of Truth) — GTM end-to-end flow setup and dashboards',
      'Magic Funnel — Ready for Full Rollout?',
      'Post-Event Execution & Results',
      'GTM Ideas and Initiatives',
    ]},
    { name: 'Sales', owner: 'Connor', items: [
      'Michael Lock — Fractional Role Setup',
      'Michelle - AI BDR System - Implementation schedule',
      'ROI Intelligence System — Training and full active use',
      'Sales Ideas and Initiatives',
    ]},
    { name: 'Marketing', owner: 'Maddie', items: [
      'H2 Events and Local Events Plan — Overview & Outcome Goals',
      'CLC Update — Next steps after 1st meeting',
      'Marketing Ideas and Initiatives',
    ]},
    { name: 'Product', owner: 'Cedric', items: [
      'Customer Voice & Hot Demands + CS Allocation',
      'Productize Amplify Workbooks',
      'Get Procurement in Lead Usage Position',
      'Product Ideas and Initiatives',
    ]},
    { name: 'Amplify & Training', owner: 'Brent', items: [
      'Amplify Direction & Applications — major workflow automations',
      'AE Training on Amplify & AI — document functionality and sales enablement',
      'Drive Customer Team Amplify Usage',
      'Amplify Ideas and Initiatives',
    ]},
  ];

  const insertTeam = db.prepare('INSERT INTO olt_teams (id, name, owner, sort_order, is_active, created_at) VALUES (?, ?, ?, ?, 1, ?)');
  const insertItem = db.prepare('INSERT INTO olt_template_items (id, team_id, text, sort_order, is_active) VALUES (?, ?, ?, ?, 1)');

  const now = new Date().toISOString();
  db.transaction(() => {
    teams.forEach((team, ti) => {
      const teamId = uuidv4();
      insertTeam.run(teamId, team.name, team.owner, ti, now);
      team.items.forEach((text, ii) => insertItem.run(uuidv4(), teamId, text, ii));
    });
  })();
  console.log('✅ Default OLT teams seeded');
}

module.exports = { getDb, initDatabase };
