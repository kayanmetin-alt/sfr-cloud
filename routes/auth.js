import { Router } from 'express';
import argon2 from 'argon2';
import { randomUUID } from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { db } from '../db.js';
import { authMiddleware, signToken, signTempToken, verifyTempToken } from '../middleware/auth.js';

export const authRouter = Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomBase64(bytes = 16) {
  const b = Buffer.alloc(bytes);
  for (let i = 0; i < bytes; i++) b[i] = Math.floor(Math.random() * 256);
  return b.toString('base64');
}

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, recoveryQuestion, recoveryAnswer, recoveryEncryptedKey, salt } = req.body;
    if (!email || !password || !recoveryQuestion || !recoveryAnswer) {
      return res.status(400).json({ error: 'Eksik alan.' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Geçersiz e-posta.' });
    }
    const userSalt = salt && typeof salt === 'string' ? salt : randomBase64(16);
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    const recoveryAnswerHash = await argon2.hash(recoveryAnswer.trim(), { type: argon2.argon2id });
    const id = randomUUID();
    const now = Date.now();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, recovery_question, recovery_answer_hash, recovery_encrypted_key, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, email.toLowerCase().trim(), passwordHash, userSalt, recoveryQuestion.trim(), recoveryAnswerHash, recoveryEncryptedKey || null, now);

    db.prepare(`
      INSERT OR IGNORE INTO user_settings (user_id, keep_old_passwords, mask_in_list, security_lock_enabled, auto_lock_enabled)
      VALUES (?, 0, 1, 0, 1)
    `).run(id);

    const token = signToken(id, email);
    return res.status(201).json({ token, userId: id, email: email.toLowerCase().trim(), salt: userSalt });
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı.' });
    }
    console.error(e);
    return res.status(500).json({ error: 'Kayıt başarısız.' });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve parola gerekli.' });
    }
    const row = db.prepare('SELECT id, email, password_hash, salt, totp_secret FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!row) {
      return res.status(401).json({ error: 'E-posta veya parola hatalı.' });
    }
    const ok = await argon2.verify(row.password_hash, password);
    if (!ok) {
      return res.status(401).json({ error: 'E-posta veya parola hatalı.' });
    }
    if (row.totp_secret) {
      const tempToken = signTempToken(row.id, row.email);
      return res.json({ needs2fa: true, tempToken, email: row.email });
    }
    const token = signToken(row.id, row.email);
    return res.json({ token, userId: row.id, email: row.email, salt: row.salt || '' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Giriş başarısız.' });
  }
});

authRouter.post('/recovery/verify', async (req, res) => {
  try {
    const { email, recoveryAnswer } = req.body;
    if (!email || recoveryAnswer === undefined) {
      return res.status(400).json({ error: 'Eksik alan.' });
    }
    const row = db.prepare('SELECT id, recovery_answer_hash, recovery_encrypted_key FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!row) {
      return res.status(404).json({ error: 'Hesap bulunamadı.' });
    }
    const ok = await argon2.verify(row.recovery_answer_hash, String(recoveryAnswer).trim());
    if (!ok) {
      return res.status(401).json({ error: 'Güvenlik cevabı hatalı.' });
    }
    return res.json({ userId: row.id, recoveryEncryptedKey: row.recovery_encrypted_key || null });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Doğrulama başarısız.' });
  }
});

authRouter.get('/recovery/question', (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: 'E-posta gerekli.' });
  }
  const row = db.prepare('SELECT recovery_question FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!row) {
    return res.status(404).json({ error: 'Hesap bulunamadı.' });
  }
  return res.json({ recoveryQuestion: row.recovery_question });
});

authRouter.post('/recovery/reset-password', async (req, res) => {
  try {
    const { userId, newPassword, newRecoveryEncryptedKey } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'Eksik alan.' });
    }
    const row = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!row) {
      return res.status(404).json({ error: 'Hesap bulunamadı.' });
    }
    const newPasswordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    db.prepare('UPDATE users SET password_hash = ?, recovery_encrypted_key = ? WHERE id = ?')
      .run(newPasswordHash, newRecoveryEncryptedKey || null, userId);
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(userId);
    const token = signToken(user.id, user.email);
    return res.json({ token, userId: user.id, email: user.email });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Parola sıfırlanamadı.' });
  }
});

authRouter.get('/me', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT id, email, salt, totp_secret FROM users WHERE id = ?').get(req.userId);
  if (!row) return res.status(404).json({ error: 'Hesap bulunamadı.' });
  res.json({ userId: row.id, email: row.email, salt: row.salt || '', twoFaEnabled: !!row.totp_secret });
});

authRouter.get('/2fa/status', authMiddleware, (req, res) => {
  const row = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(req.userId);
  res.json({ enabled: !!row?.totp_secret });
});

authRouter.post('/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(req.userId);
    if (!user) return res.status(404).json({ error: 'Hesap bulunamadı.' });
    const secret = speakeasy.generateSecret({ name: `Şifre Kasası (${user.email})`, length: 20 });
    db.prepare('UPDATE users SET pending_totp_secret = ? WHERE id = ?').run(secret.base32, req.userId);
    const otpauthUrl = `otpauth://totp/Şifre%20Kasası:${encodeURIComponent(user.email)}?secret=${secret.base32}&issuer=Şifre%20Kasası`;
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return res.json({ qrDataUrl, secret: secret.base32 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '2FA kurulumu başarısız.' });
  }
});

authRouter.post('/2fa/enable', authMiddleware, (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Doğrulama kodu gerekli.' });
    const row = db.prepare('SELECT pending_totp_secret FROM users WHERE id = ?').get(req.userId);
    if (!row?.pending_totp_secret) return res.status(400).json({ error: 'Önce 2FA kurulumunu başlatın.' });
    const valid = speakeasy.totp.verify({ secret: row.pending_totp_secret, encoding: 'base32', token: code.trim() });
    if (!valid) return res.status(401).json({ error: 'Kod hatalı veya süresi doldu.' });
    db.prepare('UPDATE users SET totp_secret = ?, pending_totp_secret = NULL WHERE id = ?').run(row.pending_totp_secret, req.userId);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '2FA etkinleştirilemedi.' });
  }
});

authRouter.post('/2fa/disable', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Parola gerekli.' });
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    if (!row) return res.status(404).json({ error: 'Hesap bulunamadı.' });
    const ok = await argon2.verify(row.password_hash, password);
    if (!ok) return res.status(401).json({ error: 'Parola hatalı.' });
    db.prepare('UPDATE users SET totp_secret = NULL, pending_totp_secret = NULL WHERE id = ?').run(req.userId);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '2FA kapatılamadı.' });
  }
});

authRouter.post('/2fa/verify', async (req, res) => {
  try {
    const { tempToken, code } = req.body;
    if (!tempToken || !code) return res.status(400).json({ error: 'Geçici token ve kod gerekli.' });
    const payload = verifyTempToken(tempToken);
    if (!payload) return res.status(401).json({ error: 'Oturum süresi doldu. Tekrar giriş yapın.' });
    const row = db.prepare('SELECT id, email, salt FROM users WHERE id = ?').get(payload.userId);
    if (!row || !row.totp_secret) return res.status(401).json({ error: 'Doğrulama başarısız.' });
    const valid = speakeasy.totp.verify({ secret: row.totp_secret, encoding: 'base32', token: String(code).trim() });
    if (!valid) return res.status(401).json({ error: 'Kod hatalı veya süresi doldu.' });
    const token = signToken(row.id, row.email);
    return res.json({ token, userId: row.id, email: row.email, salt: row.salt || '' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Doğrulama başarısız.' });
  }
});

authRouter.put('/me/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Mevcut ve yeni parola gerekli.' });
    }
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    if (!row) return res.status(404).json({ error: 'Hesap bulunamadı.' });
    const ok = await argon2.verify(row.password_hash, currentPassword);
    if (!ok) return res.status(401).json({ error: 'Mevcut parola hatalı.' });
    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, req.userId);
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Parola güncellenemedi.' });
  }
});

authRouter.delete('/me', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.userId);
    if (!row) return res.status(404).json({ error: 'Hesap bulunamadı.' });
    const ok = await argon2.verify(row.password_hash, password);
    if (!ok) return res.status(401).json({ error: 'Parola hatalı.' });
    db.prepare('DELETE FROM password_records WHERE user_id = ?').run(req.userId);
    db.prepare('DELETE FROM user_settings WHERE user_id = ?').run(req.userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Hesap silinemedi.' });
  }
});
