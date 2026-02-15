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
    try {
      await db.createUser({
        id,
        email: email.toLowerCase().trim(),
        passwordHash,
        salt: userSalt,
        recoveryQuestion: recoveryQuestion.trim(),
        recoveryAnswerHash,
        recoveryEncryptedKey: recoveryEncryptedKey || null,
        createdAt: now,
      });
    } catch (e) {
      if (e.code === 6 || e.message?.includes('UNIQUE') || e.message?.includes('already exists')) {
        return res.status(409).json({ error: 'Bu e-posta zaten kayıtlı.' });
      }
      throw e;
    }
    await db.createDefaultSettings(id);
    const token = signToken(id, email);
    return res.status(201).json({ token, userId: id, email: email.toLowerCase().trim(), salt: userSalt });
  } catch (e) {
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
    const row = await db.getUserByEmail(email.toLowerCase().trim());
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
    const row = await db.getUserByEmail(email.toLowerCase().trim());
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

authRouter.get('/recovery/question', async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: 'E-posta gerekli.' });
  }
  const row = await db.getUserByEmail(email.toLowerCase().trim());
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
    const row = await db.getUserById(userId);
    if (!row) {
      return res.status(404).json({ error: 'Hesap bulunamadı.' });
    }
    const newPasswordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await db.updateUser(userId, { password_hash: newPasswordHash, recovery_encrypted_key: newRecoveryEncryptedKey || null });
    const user = await db.getUserById(userId);
    const token = signToken(user.id, user.email);
    return res.json({ token, userId: user.id, email: user.email });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Parola sıfırlanamadı.' });
  }
});

authRouter.get('/me', authMiddleware, async (req, res) => {
  const row = await db.getUserById(req.userId);
  if (!row) return res.status(404).json({ error: 'Hesap bulunamadı.' });
  res.json({ userId: row.id, email: row.email, salt: row.salt || '', twoFaEnabled: !!row.totp_secret });
});

authRouter.get('/2fa/status', authMiddleware, async (req, res) => {
  const row = await db.getUserById(req.userId);
  res.json({ enabled: !!row?.totp_secret });
});

authRouter.post('/2fa/setup', authMiddleware, async (req, res) => {
  try {
    const user = await db.getUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'Hesap bulunamadı.' });
    const secret = speakeasy.generateSecret({ name: `Şifre Kasası (${user.email})`, length: 20 });
    await db.updateUser(req.userId, { pending_totp_secret: secret.base32 });
    const otpauthUrl = `otpauth://totp/Şifre%20Kasası:${encodeURIComponent(user.email)}?secret=${secret.base32}&issuer=Şifre%20Kasası`;
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return res.json({ qrDataUrl, secret: secret.base32 });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: '2FA kurulumu başarısız.' });
  }
});

authRouter.post('/2fa/enable', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') return res.status(400).json({ error: 'Doğrulama kodu gerekli.' });
    const row = await db.getUserById(req.userId);
    if (!row?.pending_totp_secret) return res.status(400).json({ error: 'Önce 2FA kurulumunu başlatın.' });
    const valid = speakeasy.totp.verify({ secret: row.pending_totp_secret, encoding: 'base32', token: code.trim() });
    if (!valid) return res.status(401).json({ error: 'Kod hatalı veya süresi doldu.' });
    await db.updateUser(req.userId, { totp_secret: row.pending_totp_secret, pending_totp_secret: null });
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
    const row = await db.getUserById(req.userId);
    if (!row) return res.status(404).json({ error: 'Hesap bulunamadı.' });
    const ok = await argon2.verify(row.password_hash, password);
    if (!ok) return res.status(401).json({ error: 'Parola hatalı.' });
    await db.updateUser(req.userId, { totp_secret: null, pending_totp_secret: null });
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
    const row = await db.getUserById(payload.userId);
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
    const row = await db.getUserById(req.userId);
    if (!row) return res.status(404).json({ error: 'Hesap bulunamadı.' });
    const ok = await argon2.verify(row.password_hash, currentPassword);
    if (!ok) return res.status(401).json({ error: 'Mevcut parola hatalı.' });
    const newHash = await argon2.hash(newPassword, { type: argon2.argon2id });
    await db.updateUser(req.userId, { password_hash: newHash });
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Parola güncellenemedi.' });
  }
});

authRouter.delete('/me', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    const row = await db.getUserById(req.userId);
    if (!row) return res.status(404).json({ error: 'Hesap bulunamadı.' });
    const ok = await argon2.verify(row.password_hash, password);
    if (!ok) return res.status(401).json({ error: 'Parola hatalı.' });
    await db.deleteUser(req.userId);
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Hesap silinemedi.' });
  }
});
