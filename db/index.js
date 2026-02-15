let _db;

export async function initDb() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const m = await import('./firestore.js');
    await m.init();
    _db = m.db;
  } else {
    const m = await import('./sqlite.js');
    await m.init();
    _db = m.db;
  }
}

export function getDb() {
  return _db;
}

export const db = new Proxy({}, {
  get(_, prop) {
    const adapter = getDb();
    if (!adapter) throw new Error('DB not initialized. Call initDb() first.');
    return adapter[prop];
  },
});
