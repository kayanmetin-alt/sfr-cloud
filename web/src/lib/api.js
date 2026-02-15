const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API = API_BASE ? `${API_BASE}/api` : '/api';

function getToken() {
  return localStorage.getItem('token');
}

function getHeaders(includeAuth = true) {
  const h = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const t = getToken();
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
}

async function handleRes(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText || 'İstek başarısız');
  return data;
}

export const auth = {
  register: (body) =>
    fetch(`${API}/auth/register`, { method: 'POST', headers: getHeaders(false), body: JSON.stringify(body) }).then(handleRes),
  login: (body) =>
    fetch(`${API}/auth/login`, { method: 'POST', headers: getHeaders(false), body: JSON.stringify(body) }).then(handleRes),
  me: () =>
    fetch(`${API}/auth/me`, { headers: getHeaders() }).then(handleRes),
  recoveryQuestion: (email) =>
    fetch(`${API}/auth/recovery/question?email=${encodeURIComponent(email)}`).then(handleRes),
  recoveryVerify: (body) =>
    fetch(`${API}/auth/recovery/verify`, { method: 'POST', headers: getHeaders(false), body: JSON.stringify(body) }).then(handleRes),
  recoveryResetPassword: (body) =>
    fetch(`${API}/auth/recovery/reset-password`, { method: 'POST', headers: getHeaders(false), body: JSON.stringify(body) }).then(handleRes),
  changePassword: (body) =>
    fetch(`${API}/auth/me/password`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleRes),
  deleteAccount: (password) =>
    fetch(`${API}/auth/me`, { method: 'DELETE', headers: getHeaders(), body: JSON.stringify({ password }) }).then((r) => { if (!r.ok) return r.json().then(d => { throw new Error(d.error); }); return r; }),
  twoFaStatus: () => fetch(`${API}/auth/2fa/status`, { headers: getHeaders() }).then(handleRes),
  twoFaSetup: () => fetch(`${API}/auth/2fa/setup`, { method: 'POST', headers: getHeaders() }).then(handleRes),
  twoFaEnable: (code) => fetch(`${API}/auth/2fa/enable`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ code }) }).then(handleRes),
  twoFaDisable: (password) => fetch(`${API}/auth/2fa/disable`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ password }) }).then(handleRes),
  twoFaVerify: (tempToken, code) => fetch(`${API}/auth/2fa/verify`, { method: 'POST', headers: getHeaders(false), body: JSON.stringify({ tempToken, code }) }).then(handleRes),
};

export const vault = {
  list: () =>
    fetch(`${API}/vault`, { headers: getHeaders() }).then(handleRes),
  create: (body) =>
    fetch(`${API}/vault`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleRes),
  update: (id, body) =>
    fetch(`${API}/vault/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleRes),
  delete: (id) =>
    fetch(`${API}/vault/${id}`, { method: 'DELETE', headers: getHeaders() }).then((r) => { if (r.status === 204) return; return handleRes(r); }),
  reorder: (orderedIds) =>
    fetch(`${API}/vault/reorder`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ orderedIds }) }).then(handleRes),
};

export const settings = {
  get: () =>
    fetch(`${API}/settings`, { headers: getHeaders() }).then(handleRes),
  update: (body) =>
    fetch(`${API}/settings`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(body) }).then(handleRes),
};
