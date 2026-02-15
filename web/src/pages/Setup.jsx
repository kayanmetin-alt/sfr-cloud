import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateSetup } from '../lib/validation';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';

export default function Setup() {
  const navigate = useNavigate();
  const { register, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [recoveryQuestion, setRecoveryQuestion] = useState('');
  const [recoveryAnswer, setRecoveryAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (token) {
    navigate('/', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const validation = validateSetup(password, confirm);
    if (!validation.valid) {
      setError(validation.errors.join('. '));
      return;
    }
    if (!recoveryQuestion.trim() || !recoveryAnswer.trim()) {
      setError('Güvenlik sorusu ve cevabı gerekli.');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, recoveryQuestion.trim(), recoveryAnswer.trim());
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Kayıt başarısız.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md mx-auto">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/20 text-3xl">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Kasanızı oluşturun</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Güçlü bir ana parola belirleyin</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-xl">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-muted)]">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
              placeholder="ornek@email.com"
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-muted)]">Ana parola</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 pr-12 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            <PasswordStrengthBar password={password} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--text-muted)]">Parola (tekrar)</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider pt-1 border-t border-[var(--border)] mt-1">Kurtarma</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-muted)]">Güvenlik sorusu</label>
              <input
                type="text"
                value={recoveryQuestion}
                onChange={(e) => setRecoveryQuestion(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
                placeholder="Örn: İlk evcil hayvanınızın adı?"
                disabled={loading}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-muted)]">Cevabı</label>
              <input
                type="text"
                value={recoveryAnswer}
                onChange={(e) => setRecoveryAnswer(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30"
                placeholder="Cevap"
                disabled={loading}
              />
            </div>
          </div>
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor…' : 'Kasanı Oluştur'}
          </button>
          <p className="text-center text-sm text-[var(--text-muted)]">
            Zaten hesabınız var mı?{' '}
            <Link to="/login" className="text-[var(--accent)] hover:underline">
              Giriş yap
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
