import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const vaultRouter = Router();
vaultRouter.use(authMiddleware);

vaultRouter.get('/', async (req, res) => {
  const rows = await db.getRecordsByUserId(req.userId);
  res.json(rows);
});

vaultRouter.post('/', async (req, res) => {
  const { siteName, encryptedData, sortOrder } = req.body;
  if (!siteName || !encryptedData) {
    return res.status(400).json({ error: 'Site adı ve şifreli veri gerekli.' });
  }
  const id = randomUUID();
  const now = Date.now();
  const order = typeof sortOrder === 'number' ? sortOrder : (await db.getMaxSortOrder(req.userId));
  await db.createRecord({
    id,
    userId: req.userId,
    siteName: siteName.trim(),
    encryptedData,
    updatedAt: now,
    pastEncrypted: [],
    sortOrder: order,
  });
  res.status(201).json({
    id,
    siteName: siteName.trim(),
    encryptedData,
    updatedAt: now,
    pastEncrypted: [],
    sortOrder: order,
  });
});

vaultRouter.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { siteName, encryptedData, pastEncrypted, sortOrder } = req.body;
  if (!siteName || !encryptedData) {
    return res.status(400).json({ error: 'Site adı ve şifreli veri gerekli.' });
  }
  const row = await db.getRecordByIdAndUser(id, req.userId);
  if (!row) {
    return res.status(404).json({ error: 'Kayıt bulunamadı.' });
  }
  const past = Array.isArray(pastEncrypted) ? pastEncrypted : [];
  const now = Date.now();
  const order = typeof sortOrder === 'number' ? sortOrder : (row.sortOrder ?? 0);
  await db.updateRecord(id, req.userId, {
    siteName: siteName.trim(),
    encryptedData,
    updatedAt: now,
    pastEncrypted: past,
    sortOrder: order,
  });
  res.json({
    id,
    siteName: siteName.trim(),
    encryptedData,
    updatedAt: now,
    pastEncrypted: past,
    sortOrder: order,
  });
});

vaultRouter.delete('/:id', async (req, res) => {
  const deleted = await db.deleteRecord(req.params.id, req.userId);
  if (!deleted) {
    return res.status(404).json({ error: 'Kayıt bulunamadı.' });
  }
  res.status(204).send();
});

vaultRouter.post('/reorder', async (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds dizisi gerekli.' });
  }
  await db.reorderRecords(req.userId, orderedIds);
  res.json({ ok: true });
});
