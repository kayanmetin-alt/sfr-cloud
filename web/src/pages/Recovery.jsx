import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import { validateSetup } from '../lib/validation';

export default function Recovery() {
  const navigate = useNavigate();
  const { setKeyFromPassword, setUser, updateToken } = useAuth();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleGetQuestion(e) {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('E-posta girin.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.auth.recoveryQuestion(email.trim());
      setQuestion(res.recoveryQuestion);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Soru alınamadı.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndReset(e) {
    e.preventDefault();
    setError('');
    if (step === 2) {
      setLoading(true);
      try {
        const res = await api.auth.recoveryVerify({ email: email.trim(), recoveryAnswer: answer.trim() });
        setUserId(res.userId);
        setStep(3);
      } catch (err) {
        setError(err.message || 'Güvenlik cevabı hatalı.');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 3) {
      const v = validateSetup(newPassword, newPasswordConfirm);
      if (!v.valid) {
        setError(v.errors.join('. '));
        return;
      }
      setLoading(true);
      try {
        const res = await api.auth.recoveryResetPassword({
          userId,
          newPassword,
        });
        updateToken(res.token);
        const me = await api.auth.me();
        await setKeyFromPassword(newPassword, me.salt);
        setUser({ userId: res.userId, email: res.email });
        setSuccess(true);
        setTimeout(() => navigate('/', { replace: true }), 1500);
      } catch (err) {
        setError(err.message || 'Parola sıfırlanamadı.');
      } finally {
        setLoading(false);
      }
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center">
          <p className="text-2xl text-[var(--success)]">✓</p>
          <p className="mt-2 font-semibold text-[var(--text)]">Parola sıfırlandı</p>
          <p className="text-sm text-[var(--text-muted)]">Yönlendiriliyorsunuz…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-[var(--text)]">Parola sıfırlama</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {step === 1 ? 'E-posta adresinizi girin' : step === 2 ? 'Güvenlik sorusunu yanıtlayın' : 'Yeni parola belirleyin'}
          </p>
        </div>
        <form
          onSubmit={step === 1 ? handleGetQuestion : handleVerifyAndReset}
          className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-xl"
        >
          {step === 1 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--text-muted)]">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                placeholder="ornek@email.com"
                disabled={loading}
              />
            </div>
          )}
          {step === 2 && (
            <>
              <p className="text-[var(--text)]">{question || 'Güvenlik sorusu'}</p>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-muted)]">Cevabınız</label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  disabled={loading}
                />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-muted)]">Yeni parola</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-muted)]">Yeni parola (tekrar)</label>
                <input
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 text-[var(--text)] outline-none focus:border-[var(--accent)]"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </>
          )}
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setStep((s) => s - 1); setError(''); }}
                className="rounded-xl border border-[var(--border)] px-4 py-3 text-[var(--text-muted)]"
              >
                Geri
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[var(--accent)] py-3 font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {loading ? '…' : step === 1 ? 'Devam' : step === 2 ? 'Doğrula' : 'Parolayı sıfırla'}
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
          <Link to="/login" className="text-[var(--accent)] hover:underline">
            Girişe dön
          </Link>
        </p>
      </div>
    </div>
  );
}
