import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.js';
import { vaultRouter } from './routes/vault.js';
import { settingsRouter } from './routes/settings.js';
import { initDb } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await initDb();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Çok fazla istek. Lütfen daha sonra deneyin.' },
});
app.use('/api/', limiter);

app.use('/api/auth', authRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (_, res) => res.json({ ok: true }));

const serveWebStatic = process.env.SERVE_WEB_STATIC;
if (serveWebStatic) {
  const staticPath = path.resolve(serveWebStatic);
  app.use(express.static(staticPath));
  app.get('*', (_, res) => res.sendFile(path.join(staticPath, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT}`);
});
