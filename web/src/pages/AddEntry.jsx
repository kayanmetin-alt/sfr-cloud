import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import { encrypt } from '../lib/crypto';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';

export default function AddEntry() {
  const navigate = useNavigate();
  const { cryptoKey } = useAuth();
  const [siteName, setSiteName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!siteName.trim() || !password) {
      setError('Site adı ve şifre girin.');
      return;
    }
    setLoading(true);
    try {
      const encryptedData = await encrypt(password, cryptoKey);
      await api.vault.create({
        siteName: siteName.trim(),
        encryptedData,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Kayıt eklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-page">
      <h1>Yeni kayıt</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label>Site / uygulama adı</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="form-input"
            placeholder="Örn: Gmail, Netflix"
            autoFocus
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label>Şifre</label>
          <div className="form-input-wrap">
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              placeholder="••••••••"
              disabled={loading}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="form-toggle-vis">
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
          <PasswordStrengthBar password={password} />
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            Vazgeç
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
