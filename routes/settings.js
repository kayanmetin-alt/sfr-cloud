import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const settingsRouter = Router();
settingsRouter.use(authMiddleware);

settingsRouter.get('/', (req, res) => {
  const row = db.prepare(`
    SELECT keep_old_passwords, mask_in_list, security_lock_enabled, auto_lock_enabled
    FROM user_settings WHERE user_id = ?
  `).get(req.userId);
  if (!row) {
    return res.json({
      keepOldPasswords: false,
      maskInList: true,
      securityLockEnabled: false,
      autoLockEnabled: true,
    });
  }
  res.json({
    keepOldPasswords: !!row.keep_old_passwords,
    maskInList: !!row.mask_in_list,
    securityLockEnabled: !!row.security_lock_enabled,
    autoLockEnabled: !!row.auto_lock_enabled,
  });
});

settingsRouter.put('/', (req, res) => {
  const { keepOldPasswords, maskInList, securityLockEnabled, autoLockEnabled } = req.body;
  db.prepare(`
    INSERT INTO user_settings (user_id, keep_old_passwords, mask_in_list, security_lock_enabled, auto_lock_enabled)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      keep_old_passwords = excluded.keep_old_passwords,
      mask_in_list = excluded.mask_in_list,
      security_lock_enabled = excluded.security_lock_enabled,
      auto_lock_enabled = excluded.auto_lock_enabled
  `).run(
    req.userId,
    keepOldPasswords ? 1 : 0,
    maskInList ? 1 : 0,
    securityLockEnabled ? 1 : 0,
    autoLockEnabled ? 1 : 0,
  );
  res.json({ ok: true });
});
