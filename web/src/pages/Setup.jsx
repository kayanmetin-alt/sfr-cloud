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

  const inputClass =
    'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] placeholder-[var(--text-muted)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/30';
  const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--text-muted)]';

  return (
    <div className="setup-page min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-[var(--bg)]">
      <div className="w-full max-w-lg mx-auto">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)]/20 text-3xl">
            🔐
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">Kasanızı oluşturun</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Güçlü bir ana parola belirleyin</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-5">
              Hesap bilgileri
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>E-posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="ornek@email.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div>
                <label className={labelClass}>Ana parola</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-12`}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                    aria-label={showPass ? 'Parolayı gizle' : 'Parolayı göster'}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                <PasswordStrengthBar password={password} />
              </div>
              <div>
                <label className={labelClass}>Parola (tekrar)</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-xl">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-5">
              Kurtarma
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Güvenlik sorusu</label>
                <input
                  type="text"
                  value={recoveryQuestion}
                  onChange={(e) => setRecoveryQuestion(e.target.value)}
                  className={inputClass}
                  placeholder="Örn: İlk evcil hayvanınızın adı?"
                  disabled={loading}
                />
              </div>
              <div>
                <label className={labelClass}>Cevabı</label>
                <input
                  type="text"
                  value={recoveryAnswer}
                  onChange={(e) => setRecoveryAnswer(e.target.value)}
                  className={inputClass}
                  placeholder="Cevap"
                  disabled={loading}
                />
              </div>
            </div>
          </section>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-xl space-y-4">
            {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[var(--accent)] py-3.5 font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? 'Oluşturuluyor…' : 'Kasanı Oluştur'}
            </button>
            <p className="text-center text-sm text-[var(--text-muted)]">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="text-[var(--accent)] hover:underline">
                Giriş yap
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
