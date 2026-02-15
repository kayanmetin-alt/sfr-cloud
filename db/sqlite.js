import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.SQLITE_PATH || join(__dirname, '..', 'sfr.db');
let database;

export async function init() {
  database = new Database(dbPath);
  database.exec(`
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
      sort_order INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      keep_old_passwords INTEGER DEFAULT 0,
      mask_in_list INTEGER DEFAULT 1,
      security_lock_enabled INTEGER DEFAULT 0,
      auto_lock_enabled INTEGER DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_records_user ON password_records(user_id);
  `);
  try { database.exec('ALTER TABLE users ADD COLUMN salt TEXT'); } catch (_) {}
  try { database.exec('ALTER TABLE users ADD COLUMN totp_secret TEXT'); } catch (_) {}
  try { database.exec('ALTER TABLE users ADD COLUMN pending_totp_secret TEXT'); } catch (_) {}
  database.exec("UPDATE users SET salt = hex(randomblob(16)) WHERE salt IS NULL OR salt = ''");
}

export const db = {
  async createUser(data) {
    database.prepare(`
      INSERT INTO users (id, email, password_hash, salt, recovery_question, recovery_answer_hash, recovery_encrypted_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(data.id, data.email, data.passwordHash, data.salt, data.recoveryQuestion, data.recoveryAnswerHash, data.recoveryEncryptedKey ?? null, data.createdAt);
  },

  async getUserByEmail(email) {
    const r = database.prepare('SELECT * FROM users WHERE email = ?').get(email);
    return r ? { ...r } : null;
  },

  async getUserById(id) {
    const r = database.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return r ? { ...r } : null;
  },

  async updateUser(id, data) {
    const allowed = ['password_hash', 'totp_secret', 'pending_totp_secret', 'recovery_encrypted_key'];
    const parts = [];
    const values = [];
    for (const k of allowed) {
      if (data[k] !== undefined) {
        parts.push(`${k} = ?`);
        values.push(data[k]);
      }
    }
    if (parts.length === 0) return;
    values.push(id);
    database.prepare(`UPDATE users SET ${parts.join(', ')} WHERE id = ?`).run(...values);
  },

  async deleteUser(id) {
    database.prepare('DELETE FROM password_records WHERE user_id = ?').run(id);
    database.prepare('DELETE FROM user_settings WHERE user_id = ?').run(id);
    database.prepare('DELETE FROM users WHERE id = ?').run(id);
  },

  async createDefaultSettings(userId) {
    database.prepare(`
      INSERT OR IGNORE INTO user_settings (user_id, keep_old_passwords, mask_in_list, security_lock_enabled, auto_lock_enabled) VALUES (?, 0, 1, 0, 1)
    `).run(userId);
  },

  async getSettings(userId) {
    const r = database.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);
    return r ? { ...r } : null;
  },

  async upsertSettings(userId, prefs) {
    database.prepare(`
      INSERT INTO user_settings (user_id, keep_old_passwords, mask_in_list, security_lock_enabled, auto_lock_enabled)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        keep_old_passwords = excluded.keep_old_passwords,
        mask_in_list = excluded.mask_in_list,
        security_lock_enabled = excluded.security_lock_enabled,
        auto_lock_enabled = excluded.auto_lock_enabled
    `).run(userId, prefs.keepOldPasswords ? 1 : 0, prefs.maskInList ? 1 : 0, prefs.securityLockEnabled ? 1 : 0, prefs.autoLockEnabled ? 1 : 0);
  },

  async getRecordsByUserId(userId) {
    const rows = database.prepare(`
      SELECT id, site_name, encrypted_data, updated_at, past_encrypted, sort_order FROM password_records WHERE user_id = ? ORDER BY sort_order ASC
    `).all(userId);
    return rows.map(r => ({
      id: r.id,
      siteName: r.site_name,
      encryptedData: r.encrypted_data,
      updatedAt: r.updated_at,
      pastEncrypted: JSON.parse(r.past_encrypted || '[]'),
      sortOrder: r.sort_order,
    }));
  },

  async getMaxSortOrder(userId) {
    const r = database.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM password_records WHERE user_id = ?').get(userId);
    return r?.n ?? 0;
  },

  async createRecord(data) {
    database.prepare(`
      INSERT INTO password_records (id, user_id, site_name, encrypted_data, updated_at, past_encrypted, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(data.id, data.userId, data.siteName, data.encryptedData, data.updatedAt, JSON.stringify(data.pastEncrypted || []), data.sortOrder ?? 0);
  },

  async getRecordByIdAndUser(id, userId) {
    const r = database.prepare('SELECT * FROM password_records WHERE id = ? AND user_id = ?').get(id, userId);
    return r ? { ...r, pastEncrypted: JSON.parse(r.past_encrypted || '[]') } : null;
  },

  async updateRecord(id, userId, data) {
    const past = Array.isArray(data.pastEncrypted) ? JSON.stringify(data.pastEncrypted) : '[]';
    database.prepare(`
      UPDATE password_records SET site_name = ?, encrypted_data = ?, updated_at = ?, past_encrypted = ?, sort_order = ? WHERE id = ? AND user_id = ?
    `).run(data.siteName, data.encryptedData, data.updatedAt, past, data.sortOrder ?? 0, id, userId);
  },

  async deleteRecord(id, userId) {
    const r = database.prepare('DELETE FROM password_records WHERE id = ? AND user_id = ?').run(id, userId);
    return r.changes > 0;
  },

  async reorderRecords(userId, orderedIds) {
    const stmt = database.prepare('UPDATE password_records SET sort_order = ? WHERE id = ? AND user_id = ?');
    orderedIds.forEach((id, index) => stmt.run(index, id, userId));
  },
};
