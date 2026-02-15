import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.SQLITE_PATH || join(__dirname, 'sfr.db');

export const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      recovery_question TEXT NOT NULL,
      recovery_answer_hash TEXT NOT NULL,
      recovery_encrypted_key TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      site_name TEXT NOT NULL,
      encrypted_data TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      past_encrypted TEXT DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      keep_old_passwords INTEGER DEFAULT 0,
      mask_in_list INTEGER DEFAULT 1,
      security_lock_enabled INTEGER DEFAULT 0,
      auto_lock_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_records_user ON password_records(user_id);
  `);
  try {
    db.exec('ALTER TABLE users ADD COLUMN salt TEXT');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE users ADD COLUMN totp_secret TEXT');
  } catch (_) {}
  try {
    db.exec('ALTER TABLE users ADD COLUMN pending_totp_secret TEXT');
  } catch (_) {}
  db.exec("UPDATE users SET salt = hex(randomblob(16)) WHERE salt IS NULL OR salt = ''");
  return Promise.resolve();
}
