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
    <div className="login-page">
      <div className="login-inner">
        <div className="login-header">
          <div className="login-logo">🔐</div>
          <h1 className="login-title">Kasanızı oluşturun</h1>
          <p className="login-subtitle">Güçlü bir ana parola belirleyin</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form-card">
          <div className="form-section-title">Hesap bilgileri</div>
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
            <label>Ana parola</label>
            <div className="form-input-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            <PasswordStrengthBar password={password} />
          </div>
          <div className="form-group">
            <label>Parola (tekrar)</label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={loading}
            />
          </div>

          <div className="form-section-title">Kurtarma</div>
          <div className="form-group">
            <label>Güvenlik sorusu</label>
            <input
              type="text"
              value={recoveryQuestion}
              onChange={(e) => setRecoveryQuestion(e.target.value)}
              className="form-input"
              placeholder="Örn: İlk evcil hayvanınızın adı?"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Cevabı</label>
            <input
              type="text"
              value={recoveryAnswer}
              onChange={(e) => setRecoveryAnswer(e.target.value)}
              className="form-input"
              placeholder="Cevap"
              disabled={loading}
            />
          </div>

          {error && <p className="form-error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Oluşturuluyor…' : 'Kasanı Oluştur'}
          </button>
          <div className="login-links">
            <Link to="/login">Zaten hesabınız var mı? Giriş yap</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
