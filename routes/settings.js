import { Router } from 'express';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const settingsRouter = Router();
settingsRouter.use(authMiddleware);

const defaults = {
  keepOldPasswords: false,
  maskInList: true,
  securityLockEnabled: false,
  autoLockEnabled: true,
};

settingsRouter.get('/', async (req, res) => {
  const row = await db.getSettings(req.userId);
  if (!row) {
    return res.json(defaults);
  }
  res.json({
    keepOldPasswords: !!row.keep_old_passwords,
    maskInList: !!row.mask_in_list,
    securityLockEnabled: !!row.security_lock_enabled,
    autoLockEnabled: !!row.auto_lock_enabled,
  });
});

settingsRouter.put('/', async (req, res) => {
  const { keepOldPasswords, maskInList, securityLockEnabled, autoLockEnabled } = req.body;
  await db.upsertSettings(req.userId, {
    keepOldPasswords,
    maskInList,
    securityLockEnabled,
    autoLockEnabled,
  });
  res.json({ ok: true });
});
