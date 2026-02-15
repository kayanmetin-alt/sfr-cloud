import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWith2Fa, token } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('password');
  const [tempToken, setTempToken] = useState('');
  const [code, setCode] = useState('');

  if (token) {
    navigate('/', { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (step === 'password') {
      if (!email.trim() || !password) {
        setError('E-posta ve parola girin.');
        return;
      }
      setLoading(true);
      try {
        const res = await login(email.trim(), password);
        if (res.needs2fa) {
          setTempToken(res.tempToken);
          setStep('2fa');
        } else {
          navigate('/', { replace: true });
        }
      } catch (err) {
        setError(err.message || 'Giriş başarısız.');
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === '2fa') {
      if (!code.trim() || code.trim().length < 6) {
        setError('6 haneli kodu girin.');
        return;
      }
      setLoading(true);
      try {
        await loginWith2Fa(tempToken, code.trim(), password);
        navigate('/', { replace: true });
      } catch (err) {
        setError(err.message || 'Kod hatalı veya süresi doldu.');
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div className="login-page">
      <div className="login-inner">
        <div className="login-header">
          <div className="login-logo">🔐</div>
          <h1 className="login-title">Şifre Kasası</h1>
          <p className="login-subtitle">
            {step === '2fa' ? 'İki adımlı doğrulama kodu' : 'Hesabınıza giriş yapın'}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="login-form-card">
          {step === 'password' && (
            <>
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
              <div className="form-group">
                <label>Parola</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
            </>
          )}
          {step === '2fa' && (
            <div className="form-group">
              <label>Doğrulama kodu</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="form-input"
                placeholder="000000"
                autoComplete="one-time-code"
                disabled={loading}
                autoFocus
              />
              <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Uygulamanızdaki (Google Authenticator vb.) 6 haneli kodu girin.
              </p>
            </div>
          )}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (step === '2fa' ? 'Doğrulanıyor…' : 'Giriş yapılıyor…') : step === '2fa' ? 'Doğrula' : 'Giriş Yap'}
          </button>
          {step === '2fa' && (
            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', marginTop: '0.5rem' }}
              onClick={() => { setStep('password'); setCode(''); setError(''); }}
            >
              Geri
            </button>
          )}
          {step === 'password' && (
            <div className="login-links">
              <Link to="/recovery">Parolamı unuttum</Link>
              <span className="login-links-sep" aria-hidden />
              <Link to="/setup">Hesap oluştur</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
