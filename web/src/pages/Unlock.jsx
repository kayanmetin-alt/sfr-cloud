import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/api';

export default function Unlock() {
  const { user, setKeyFromPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!password) {
      setError('Parola girin.');
      return;
    }
    setLoading(true);
    try {
      const me = await auth.me();
      await setKeyFromPassword(password, me.salt);
    } catch (err) {
      setError(err.message || 'Parola hatalı.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/20 text-3xl">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Kasa kilitli</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{user?.email}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-muted)]">Parola</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
              disabled={loading}
            />
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? 'Açılıyor…' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}
