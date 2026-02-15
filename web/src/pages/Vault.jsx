import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../lib/api';
import { encrypt, decrypt } from '../lib/crypto';

export default function Vault() {
  const { cryptoKey } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [maskInList, setMaskInList] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [copyToast, setCopyToast] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await api.vault.list();
      const prefs = await api.settings.get();
      setMaskInList(prefs.maskInList !== false);
      setRecords(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = search.trim()
    ? records.filter((r) => r.siteName.toLowerCase().includes(search.trim().toLowerCase()))
    : records;

  async function decryptPassword(encryptedData) {
    if (!cryptoKey) return null;
    try {
      return await decrypt(encryptedData, cryptoKey);
    } catch {
      return null;
    }
  }

  async function copyPassword(record) {
    const plain = await decryptPassword(record.encryptedData);
    if (plain && navigator.clipboard) {
      await navigator.clipboard.writeText(plain);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 1500);
    }
  }

  async function deleteRecord(id) {
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    try {
      await api.vault.delete(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      alert(e.message);
    }
  }

  if (loading) {
    return (
      <div className="loading-wrap">
        <span className="loading-text">Yükleniyor…</span>
      </div>
    );
  }

  return (
    <div className="vault-page">
      <div className="vault-toolbar">
        <h1 className="vault-title">Şifrelerim</h1>
        <div className="vault-search-row">
          <div className="vault-search-wrap">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Kayıtlarda ara…"
              className="vault-search"
            />
          </div>
          <Link to="/add" className="vault-btn-add" aria-label="Yeni ekle">
            +
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="vault-empty">
          <p>{search.trim() ? 'Eşleşen kayıt yok.' : 'Henüz kayıt yok. Yeni ekleyin.'}</p>
          {!search.trim() && (
            <Link to="/add" className="vault-btn-add-inline">
              Yeni kayıt ekle
            </Link>
          )}
        </div>
      ) : (
        <ul className="vault-list">
          {filtered.map((rec) => (
            <VaultRow
              key={rec.id}
              record={rec}
              maskInList={maskInList}
              openId={openId}
              setOpenId={setOpenId}
              decryptPassword={decryptPassword}
              copyPassword={copyPassword}
              onEdit={() => navigate(`/edit/${rec.id}`)}
              onDelete={() => deleteRecord(rec.id)}
            />
          ))}
        </ul>
      )}

      {copyToast && (
        <div className="toast">
          <span className="toast-success">✓</span> Kopyalandı
        </div>
      )}
    </div>
  );
}

function VaultRow({ record, maskInList, openId, setOpenId, decryptPassword, copyPassword, onEdit, onDelete }) {
  const [plain, setPlain] = React.useState(null);
  const isOpen = openId === record.id;
  const showPassword = !maskInList || isOpen;

  React.useEffect(() => {
    if (showPassword) {
      decryptPassword(record.encryptedData).then(setPlain);
    } else {
      setPlain(null);
    }
  }, [showPassword, record.encryptedData, decryptPassword]);

  return (
    <li className="vault-card">
      <div className="vault-card-top">
        <div className="vault-card-body">
          <p className="vault-card-title">{record.siteName}</p>
          <p className="vault-card-meta">{showPassword ? (plain ?? '…') : '••••••'}</p>
        </div>
        <div className="vault-card-actions">
          <button
            type="button"
            onClick={() => copyPassword(record)}
            className="vault-btn-icon vault-btn-icon--copy"
            title="Kopyala"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {maskInList && (
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : record.id)}
              className="vault-btn-icon vault-btn-icon--toggle"
              title={isOpen ? 'Gizle' : 'Göster'}
            >
              {isOpen ? (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
          <button type="button" onClick={onEdit} className="vault-btn-icon vault-btn-icon--edit" title="Düzenle">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button type="button" onClick={onDelete} className="vault-btn-icon vault-btn-icon--delete" title="Sil">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </li>
  );
}
