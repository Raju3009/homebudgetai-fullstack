import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/auth';

/* eslint-disable react-refresh/only-export-components */
const AuthContext = createContext(null);

function readCachedUser() {
  try {
    return JSON.parse(window.localStorage.getItem('user') || 'null');
  } catch {
    window.localStorage.removeItem('user');
    return null;
  }
}

function tokenExpiresAt(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(window.atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
    return Number.isFinite(Number(claims.exp)) ? Number(claims.exp) * 1000 : null;
  } catch {
    return null;
  }
}

function saveSession(response) {
  if (!response?.token) throw new Error('The API did not return an access token.');
  window.localStorage.setItem('token', response.token);
  const expiration = Date.parse(response.expiresAt) || tokenExpiresAt(response.token);
  if (expiration) window.localStorage.setItem('tokenExpiresAt', String(expiration));
  else window.localStorage.removeItem('tokenExpiresAt');
  window.localStorage.setItem('user', JSON.stringify({
    id: response.id,
    email: response.email,
    fullName: response.fullName,
    role: response.role,
  }));
  // Keep the existing session behavior; refresh-token rotation is not implemented in this client.
  // Keep its unused refresh token out of browser storage until a refresh flow is implemented.
  window.localStorage.removeItem('refreshToken');
  return { id: response.id, email: response.email, fullName: response.fullName, role: response.role };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readCachedUser);
  const [loading, setLoading] = useState(() => Boolean(window.localStorage.getItem('token')));

  const logout = useCallback(() => {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('tokenExpiresAt');
    window.localStorage.removeItem('refreshToken');
    window.localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    const onUnauthorized = () => {
      if (active) {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('tokenExpiresAt');
        window.localStorage.removeItem('refreshToken');
        window.localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
      }
    };
    window.addEventListener('homebudget:unauthorized', onUnauthorized);

    const token = window.localStorage.getItem('token');
    if (!token) {
      return () => {
        active = false;
        window.removeEventListener('homebudget:unauthorized', onUnauthorized);
      };
    }

    authApi.me().then(({ data }) => {
      if (!active) return;
      const currentUser = { id: data.id, email: data.email, fullName: data.fullName, role: data.role };
      window.localStorage.setItem('user', JSON.stringify(currentUser));
      setUser(currentUser);
    }).catch((error) => {
      if (!active) return;
      if (error.response?.status === 401) logout();
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      window.removeEventListener('homebudget:unauthorized', onUnauthorized);
    };
  }, [logout]);

  useEffect(() => {
    const token = window.localStorage.getItem('token');
    if (!token) return undefined;
    const savedExpiration = Number(window.localStorage.getItem('tokenExpiresAt'));
    const expiration = Number.isFinite(savedExpiration) && savedExpiration > 0 ? savedExpiration : tokenExpiresAt(token);
    if (!expiration) return undefined;
    const remaining = expiration - Date.now();
    if (remaining <= 0) {
      const timer = window.setTimeout(logout, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(logout, remaining);
    return () => window.clearTimeout(timer);
  }, [user, logout]);

  const establishSession = useCallback((response) => setUser(saveSession(response)), []);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    establishSession(data);
    return data;
  }, [establishSession]);

  const register = useCallback(async (details) => {
    const { data } = await authApi.register(details);
    establishSession(data);
    return data;
  }, [establishSession]);

  const value = useMemo(() => ({ user, loading, isAuthenticated: Boolean(user && window.localStorage.getItem('token')), login, register, logout }), [user, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider.');
  return value;
}
