import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

export const vaultRouter = Router();
vaultRouter.use(authMiddleware);

vaultRouter.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT id, site_name, encrypted_data, updated_at, past_encrypted, sort_order
    FROM password_records WHERE user_id = ? ORDER BY sort_order ASC
  `).all(req.userId);
  res.json(rows.map(r => ({
    id: r.id,
    siteName: r.site_name,
    encryptedData: r.encrypted_data,
    updatedAt: r.updated_at,
    pastEncrypted: JSON.parse(r.past_encrypted || '[]'),
    sortOrder: r.sort_order,
  })));
});

vaultRouter.post('/', (req, res) => {
  const { siteName, encryptedData, sortOrder } = req.body;
  if (!siteName || !encryptedData) {
    return res.status(400).json({ error: 'Site adı ve şifreli veri gerekli.' });
  }
  const id = randomUUID();
  const now = Date.now();
  const order = typeof sortOrder === 'number' ? sortOrder : (db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM password_records WHERE user_id = ?').get(req.userId)?.n ?? 0);
  db.prepare(`
    INSERT INTO password_records (id, user_id, site_name, encrypted_data, updated_at, past_encrypted, sort_order)
    VALUES (?, ?, ?, ?, ?, '[]', ?)
  `).run(id, req.userId, siteName.trim(), encryptedData, now, order);
  res.status(201).json({
    id,
    siteName: siteName.trim(),
    encryptedData,
    updatedAt: now,
    pastEncrypted: [],
    sortOrder: order,
  });
});

vaultRouter.put('/:id', (req, res) => {
  const { id } = req.params;
  const { siteName, encryptedData, pastEncrypted, sortOrder } = req.body;
  if (!siteName || !encryptedData) {
    return res.status(400).json({ error: 'Site adı ve şifreli veri gerekli.' });
  }
  const row = db.prepare('SELECT id FROM password_records WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!row) {
    return res.status(404).json({ error: 'Kayıt bulunamadı.' });
  }
  const past = Array.isArray(pastEncrypted) ? JSON.stringify(pastEncrypted) : '[]';
  const now = Date.now();
  const order = typeof sortOrder === 'number' ? sortOrder : db.prepare('SELECT sort_order FROM password_records WHERE id = ?').get(id)?.sort_order ?? 0;
  db.prepare(`
    UPDATE password_records SET site_name = ?, encrypted_data = ?, updated_at = ?, past_encrypted = ?, sort_order = ? WHERE id = ? AND user_id = ?
  `).run(siteName.trim(), encryptedData, now, past, order, id, req.userId);
  res.json({
    id,
    siteName: siteName.trim(),
    encryptedData,
    updatedAt: now,
    pastEncrypted: JSON.parse(past),
    sortOrder: order,
  });
});

vaultRouter.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM password_records WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Kayıt bulunamadı.' });
  }
  res.status(204).send();
});

vaultRouter.post('/reorder', (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds dizisi gerekli.' });
  }
  const stmt = db.prepare('UPDATE password_records SET sort_order = ? WHERE id = ? AND user_id = ?');
  orderedIds.forEach((id, index) => {
    stmt.run(index, id, req.userId);
  });
  res.json({ ok: true });
});
