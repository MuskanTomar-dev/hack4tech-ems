import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
export const db = new Database(process.env.DB_FILE || path.join(dir, '..', 'eventhub.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  schedule TEXT NOT NULL DEFAULT '',
  rules TEXT NOT NULL DEFAULT '',
  date_time TEXT NOT NULL,
  venue TEXT NOT NULL,
  banner_url TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('individual','team')),
  min_team_size INTEGER NOT NULL DEFAULT 1,
  max_team_size INTEGER NOT NULL DEFAULT 1,
  capacity INTEGER NOT NULL DEFAULT 100,
  registration_open INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('individual','team')),
  team_name TEXT,
  leader_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  college TEXT,
  pass_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_reg_event_email ON registrations(event_id, lower(email));
CREATE INDEX IF NOT EXISTS ix_reg_email ON registrations(lower(email));
CREATE TABLE IF NOT EXISTS team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL UNIQUE REFERENCES registrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present','absent','late')),
  checked_in_at TEXT,
  marked_by TEXT
);
`);
