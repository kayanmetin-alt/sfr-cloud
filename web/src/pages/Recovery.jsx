import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import { validateSetup } from '../lib/validation';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';

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
  const [showPass, setShowPass] = useState(false);

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

  const subtitles = {
    1: 'E-posta adresinizi girin',
    2: 'Güvenlik sorusunu yanıtlayın',
    3: 'Yeni parola belirleyin',
  };

  if (success) {
    return (
      <div className="login-page">
        <div className="login-inner">
          <div className="login-form-card" style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '2rem', margin: 0, color: 'var(--success)' }}>✓</p>
            <p className="login-title" style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>Parola sıfırlandı</p>
            <p className="login-subtitle" style={{ margin: 0 }}>Yönlendiriliyorsunuz…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-inner">
        <div className="login-header">
          <div className="login-logo">🔑</div>
          <h1 className="login-title">Parola sıfırlama</h1>
          <p className="login-subtitle">{subtitles[step]}</p>
        </div>
        <form
          onSubmit={step === 1 ? handleGetQuestion : handleVerifyAndReset}
          className="login-form-card"
        >
          {step === 1 && (
            <div className="form-group">
              <label>E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="ornek@email.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
          )}
          {step === 2 && (
            <>
              <p className="login-subtitle" style={{ textAlign: 'left', marginBottom: '1rem', marginTop: 0 }}>
                {question || 'Güvenlik sorusu'}
              </p>
              <div className="form-group">
                <label>Cevabınız</label>
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="form-input"
                  placeholder="Cevap"
                  disabled={loading}
                />
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="form-group">
                <label>Yeni parola</label>
                <div className="form-input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="form-toggle-vis"
                    aria-label={showPass ? 'Parolayı gizle' : 'Parolayı göster'}
                  >
                    {showPass ? '🙈' : '👁'}
                  </button>
                </div>
                <PasswordStrengthBar password={newPassword} />
              </div>
              <div className="form-group">
                <label>Yeni parola (tekrar)</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
            </>
          )}
          {error && <p className="form-error">{error}</p>}
          <div className="form-actions">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setStep((s) => s - 1); setError(''); }}
                className="btn-secondary"
              >
                Geri
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '…' : step === 1 ? 'Devam' : step === 2 ? 'Doğrula' : 'Parolayı sıfırla'}
            </button>
          </div>
          <div className="login-links">
            <Link to="/login">Girişe dön</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
