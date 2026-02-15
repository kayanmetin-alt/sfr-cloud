import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../lib/api';
import { deriveKey, generateSaltForRegister } from '../lib/crypto';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [cryptoKey, setCryptoKey] = useState(null);
  const [salt, setSalt] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.auth.me();
      setUser(me);
    } catch {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.needs2fa) return res;
    setToken(res.token);
    localStorage.setItem('token', res.token);
    setUser({ userId: res.userId, email: res.email });
    const key = await deriveKey(password, res.salt);
    setCryptoKey(key);
    setSalt(res.salt);
  }, []);

  const loginWith2Fa = useCallback(async (tempToken, code, password) => {
    const res = await api.auth.twoFaVerify(tempToken, code);
    setToken(res.token);
    localStorage.setItem('token', res.token);
    setUser({ userId: res.userId, email: res.email });
    const key = await deriveKey(password, res.salt);
    setCryptoKey(key);
    setSalt(res.salt);
  }, []);

  const register = useCallback(async (email, password, recoveryQuestion, recoveryAnswer) => {
    const saltForServer = generateSaltForRegister();
    const res = await api.auth.register({
      email,
      password,
      recoveryQuestion,
      recoveryAnswer,
      salt: saltForServer,
    });
    setToken(res.token);
    localStorage.setItem('token', res.token);
    setUser({ userId: res.userId, email: res.email });
    const key = await deriveKey(password, res.salt);
    setCryptoKey(key);
    setSalt(res.salt);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setCryptoKey(null);
    setSalt(null);
    localStorage.removeItem('token');
  }, []);

  const setKeyFromPassword = useCallback(async (password, saltFromServer) => {
    const key = await deriveKey(password, saltFromServer);
    setCryptoKey(key);
    setSalt(saltFromServer);
  }, []);

  const updateToken = (t) => {
    setToken(t);
    if (t) localStorage.setItem('token', t);
    else localStorage.removeItem('token');
  };

  const value = {
    token,
    user,
    cryptoKey,
    salt,
    loading,
    login,
    loginWith2Fa,
    register,
    logout,
    setKeyFromPassword,
    setUser,
    updateToken,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
