import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import { encrypt, decrypt } from '../lib/crypto';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';

export default function EditEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cryptoKey } = useAuth();
  const [record, setRecord] = useState(null);
  const [siteName, setSiteName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [keepOldPasswords, setKeepOldPasswords] = useState(false);
  const [pastDecrypted, setPastDecrypted] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.vault.list();
        const r = list.find((x) => x.id === id);
        if (!r) {
          navigate('/', { replace: true });
          return;
        }
        setRecord(r);
        setSiteName(r.siteName);
        const prefs = await api.settings.get();
        setKeepOldPasswords(prefs.keepOldPasswords === true);
        const plain = await decrypt(r.encryptedData, cryptoKey);
        setPassword(plain || '');
        if (r.pastEncrypted?.length && prefs.keepOldPasswords) {
          const past = [];
          for (const enc of r.pastEncrypted) {
            try {
              past.push(await decrypt(enc, cryptoKey));
            } catch {
              past.push('—');
            }
          }
          setPastDecrypted(past);
        }
      } catch (e) {
        navigate('/', { replace: true });
      }
    })();
  }, [id, cryptoKey, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!record) return;
    setError('');
    if (!siteName.trim() || !password) {
      setError('Site adı ve şifre girin.');
      return;
    }
    setLoading(true);
    try {
      const encryptedData = await encrypt(password, cryptoKey);
      let pastEncrypted = record.pastEncrypted || [];
      if (keepOldPasswords && record.encryptedData !== encryptedData) {
        pastEncrypted = [...pastEncrypted, record.encryptedData];
      }
      await api.vault.update(record.id, {
        siteName: siteName.trim(),
        encryptedData,
        pastEncrypted,
        sortOrder: record.sortOrder,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Güncellenemedi.');
    } finally {
      setLoading(false);
    }
  }

  if (!record) {
    return (
      <div className="loading-wrap">
        <span className="loading-text">Yükleniyor…</span>
      </div>
    );
  }

  return (
    <div className="form-page">
      <h1>Kaydı düzenle</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <div className="form-group">
          <label>Site / uygulama adı</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            className="form-input"
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
              disabled={loading}
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className="form-toggle-vis">
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
          <PasswordStrengthBar password={password} />
        </div>
        {pastDecrypted.length > 0 && (
          <div className="form-history">
            <p className="form-history-title">Şifre geçmişi</p>
            <ul className="form-history-list">
              {pastDecrypted.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
            İptal
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Güncelleniyor…' : 'Güncelle'}
          </button>
        </div>
      </form>
    </div>
  );
}
