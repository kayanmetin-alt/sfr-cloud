import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import { decrypt } from '../lib/crypto';
import { validateSetup } from '../lib/validation';
import { PasswordStrengthBar } from '../components/PasswordStrengthBar';

const SUPPORT_EMAIL = 'metin_kayan@icloud.com';
const PRIVACY_URL = 'https://sites.google.com/view/storekey-privacy';

export default function Settings() {
  const navigate = useNavigate();
  const { logout, cryptoKey } = useAuth();
  const [prefs, setPrefs] = useState({
    keepOldPasswords: false,
    maskInList: true,
    securityLockEnabled: false,
    autoLockEnabled: true,
  });
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPassConfirm, setNewPassConfirm] = useState('');
  const [deletePass, setDeletePass] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [twoFaEnabled, setTwoFaEnabled] = useState(false);
  const [twoFaSetupOpen, setTwoFaSetupOpen] = useState(false);
  const [twoFaQr, setTwoFaQr] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaDisableOpen, setTwoFaDisableOpen] = useState(false);
  const [twoFaDisablePass, setTwoFaDisablePass] = useState('');

  useEffect(() => {
    api.settings.get().then(setPrefs).catch(() => {});
  }, []);
  useEffect(() => {
    api.auth.twoFaStatus().then((r) => setTwoFaEnabled(r.enabled)).catch(() => {});
  }, []);

  useEffect(() => {
    if (prefs.keepOldPasswords !== undefined) {
      api.settings.update(prefs).catch(() => {});
    }
  }, [prefs]);

  function handlePrefChange(key, value) {
    setPrefs((p) => ({ ...p, [key]: value }));
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setMessage('');
    const v = validateSetup(newPass, newPassConfirm);
    if (!v.valid) {
      setMessage(v.errors.join('. '));
      return;
    }
    setLoading(true);
    try {
      await api.auth.changePassword({ currentPassword: currentPass, newPassword: newPass });
      setChangePassOpen(false);
      setCurrentPass('');
      setNewPass('');
      setNewPassConfirm('');
      setMessage('');
    } catch (err) {
      setMessage(err.message || 'Parola güncellenemedi.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      await api.auth.deleteAccount(deletePass);
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setMessage(err.message || 'Hesap silinemedi.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFaSetup() {
    setMessage('');
    try {
      const res = await api.auth.twoFaSetup();
      setTwoFaQr(res.qrDataUrl);
      setTwoFaSetupOpen(true);
      setTwoFaCode('');
    } catch (err) {
      setMessage(err.message || '2FA kurulumu başarısız.');
    }
  }

  async function handleTwoFaEnable(e) {
    e.preventDefault();
    if (!twoFaCode.trim() || twoFaCode.trim().length < 6) {
      setMessage('6 haneli kodu girin.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await api.auth.twoFaEnable(twoFaCode.trim());
      setTwoFaEnabled(true);
      setTwoFaSetupOpen(false);
      setTwoFaQr('');
      setTwoFaCode('');
    } catch (err) {
      setMessage(err.message || 'Kod hatalı.');
    } finally {
      setLoading(false);
    }
  }

  async function handleTwoFaDisable(e) {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      await api.auth.twoFaDisable(twoFaDisablePass);
      setTwoFaEnabled(false);
      setTwoFaDisableOpen(false);
      setTwoFaDisablePass('');
    } catch (err) {
      setMessage(err.message || '2FA kapatılamadı.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportBackup() {
    if (!cryptoKey) return;
    setExporting(true);
    setMessage('');
    try {
      const list = await api.vault.list();
      const decrypted = [];
      for (const r of list) {
        try {
          const plain = await decrypt(r.encryptedData, cryptoKey);
          decrypted.push({ siteName: r.siteName, password: plain });
        } catch {
          decrypted.push({ siteName: r.siteName, password: '(çözülemedi)' });
        }
      }
      const blob = new Blob([JSON.stringify(decrypted, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sifre-kasasi-yedek-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err.message || 'Yedek alınamadı.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="settings-page">
      <h1 className="settings-title">Ayarlar</h1>

      <section className="settings-section">
        <h2 className="settings-section-title">Tercihler</h2>
        <ul className="settings-list">
          <li className="settings-row">
            <span className="settings-row-label">Eski şifreleri sakla</span>
            <input
              type="checkbox"
              checked={prefs.keepOldPasswords}
              onChange={(e) => handlePrefChange('keepOldPasswords', e.target.checked)}
              className="settings-checkbox"
            />
          </li>
          <li className="settings-row">
            <span className="settings-row-label">Listede şifreleri maskele</span>
            <input
              type="checkbox"
              checked={prefs.maskInList}
              onChange={(e) => handlePrefChange('maskInList', e.target.checked)}
              className="settings-checkbox"
            />
          </li>
          <li className="settings-row">
            <span className="settings-row-label">Güvenlik kilidi (5 yanlışta kilit)</span>
            <input
              type="checkbox"
              checked={prefs.securityLockEnabled}
              onChange={(e) => handlePrefChange('securityLockEnabled', e.target.checked)}
              className="settings-checkbox"
            />
          </li>
          <li className="settings-row">
            <span className="settings-row-label">Otomatik kilitleme</span>
            <input
              type="checkbox"
              checked={prefs.autoLockEnabled}
              onChange={(e) => handlePrefChange('autoLockEnabled', e.target.checked)}
              className="settings-checkbox"
            />
          </li>
        </ul>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">İki adımlı doğrulama (2FA)</h2>
        {twoFaEnabled ? (
          <>
            <p className="settings-danger-desc" style={{ marginBottom: '0.75rem' }}>
              Etkin. Girişte paroladan sonra uygulama kodunuz istenecek.
            </p>
            {!twoFaDisableOpen ? (
              <button type="button" onClick={() => setTwoFaDisableOpen(true)} className="settings-btn-danger">
                2FA kapat
              </button>
            ) : (
              <form onSubmit={handleTwoFaDisable} className="settings-form">
                <div className="form-group">
                  <input
                    type="password"
                    value={twoFaDisablePass}
                    onChange={(e) => setTwoFaDisablePass(e.target.value)}
                    placeholder="Parolanız"
                    className="form-input"
                    disabled={loading}
                  />
                </div>
                {message && <p className="form-error">{message}</p>}
                <div className="form-actions">
                  <button type="button" onClick={() => { setTwoFaDisableOpen(false); setTwoFaDisablePass(''); setMessage(''); }} className="btn-secondary">
                    Vazgeç
                  </button>
                  <button type="submit" disabled={loading || !twoFaDisablePass} className="settings-btn-danger settings-btn-danger-submit">
                    Kapat
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <>
            {!twoFaSetupOpen ? (
              <>
                <p className="settings-danger-desc" style={{ marginBottom: '0.75rem' }}>
                  Girişte paroladan sonra uygulama (Google Authenticator vb.) ile ek kod istenir.
                </p>
                <button type="button" onClick={handleTwoFaSetup} className="settings-btn">
                  2FA etkinleştir
                </button>
              </>
            ) : (
              <form onSubmit={handleTwoFaEnable} className="settings-form">
                <p className="settings-danger-desc" style={{ marginBottom: '0.75rem' }}>
                  Authenticator uygulamanızla QR kodu tarayın, ardından oluşan 6 haneli kodu girin.
                </p>
                {twoFaQr && <img src={twoFaQr} alt="QR" style={{ width: 180, height: 180, marginBottom: '1rem', background: 'white', padding: 8, borderRadius: 8 }} />}
                <div className="form-group">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="form-input"
                    disabled={loading}
                  />
                </div>
                {message && <p className="form-error">{message}</p>}
                <div className="form-actions">
                  <button type="button" onClick={() => { setTwoFaSetupOpen(false); setTwoFaQr(''); setTwoFaCode(''); setMessage(''); }} className="btn-secondary">
                    İptal
                  </button>
                  <button type="submit" disabled={loading || twoFaCode.trim().length < 6} className="btn-primary">
                    Etkinleştir
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Yedekleme</h2>
        <p className="settings-danger-desc" style={{ marginBottom: '0.75rem' }}>
          Tüm kayıtlarınızı (site adı + şifre) JSON dosyası olarak indirir. Dosyayı güvenli saklayın.
        </p>
        <button
          type="button"
          onClick={handleExportBackup}
          disabled={exporting || !cryptoKey}
          className="settings-btn"
        >
          {exporting ? 'Hazırlanıyor…' : 'Yedek indir'}
        </button>
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Parola</h2>
        {!changePassOpen ? (
          <button type="button" onClick={() => setChangePassOpen(true)} className="settings-btn">
            Ana parolamı değiştir
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="settings-form">
            <div className="form-group">
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Mevcut parola"
                className="form-input"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Yeni parola"
                className="form-input"
                disabled={loading}
              />
              <PasswordStrengthBar password={newPass} />
            </div>
            <div className="form-group">
              <input
                type="password"
                value={newPassConfirm}
                onChange={(e) => setNewPassConfirm(e.target.value)}
                placeholder="Yeni parola (tekrar)"
                className="form-input"
                disabled={loading}
              />
            </div>
            {message && <p className="form-error">{message}</p>}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => { setChangePassOpen(false); setMessage(''); }}
                className="btn-secondary"
              >
                İptal
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? '…' : 'Güncelle'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="settings-section">
        <h2 className="settings-section-title">Destek</h2>
        <ul className="settings-link-list">
          <li>
            <a href={`mailto:${SUPPORT_EMAIL}`}>
              İletişim / Destek — {SUPPORT_EMAIL}
            </a>
          </li>
          <li>
            <a href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
              Gizlilik politikası
            </a>
          </li>
        </ul>
      </section>

      <section className="settings-section danger-zone">
        <h2 className="settings-section-title">Tehlikeli bölge</h2>
        {!deleteOpen ? (
          <button type="button" onClick={() => setDeleteOpen(true)} className="settings-btn-danger">
            Hesabımı ve verilerimi sil
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="settings-form">
            <p className="settings-danger-desc">
              Bu işlem geri alınamaz. Tüm şifreleriniz kalıcı olarak silinecektir. Onay için parolanızı girin.
            </p>
            <div className="form-group">
              <input
                type="password"
                value={deletePass}
                onChange={(e) => setDeletePass(e.target.value)}
                placeholder="Parolanız"
                className="form-input"
                disabled={loading}
              />
            </div>
            {message && <p className="form-error">{message}</p>}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => { setDeleteOpen(false); setMessage(''); setDeletePass(''); }}
                className="btn-secondary"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={loading || !deletePass}
                className="settings-btn-danger settings-btn-danger-submit"
              >
                Hesabımı sil
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
