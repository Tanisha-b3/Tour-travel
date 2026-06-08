import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  loginUser,
  registerUser,
  getMe,
  refreshAccessToken,
  logoutRequest,
  getAccessToken,
  getRefreshToken,
  setSessionInvalidHandler,
  setTokenRefreshHandler,
  clearTokens,
} from "../services/api.js";
import { useToast } from "./ToastContext.jsx";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => getAccessToken());
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState({ open: false, tab: "login" });
  const addToast = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!getAccessToken() && getRefreshToken()) {
          try {
            await refreshAccessToken();
          } catch { /* fall through to getMe */ }
        }
        if (getAccessToken()) {
          const me = await getMe();
          if (!cancelled) setUser(me);
        }
      } catch {
        clearTokens();
        if (!cancelled) { setToken(null); setUser(null); }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setSessionInvalidHandler(() => {
      setToken(null);
      setUser(null);
      addToast("info", "Your session expired. Please sign in again.");
    });
    setTokenRefreshHandler(({ accessToken, refreshToken }) => {
      if (accessToken !== token) setToken(accessToken);
      if (!refreshToken) setUser(null);
    });
  }, [token, addToast]);

  const login = useCallback(async (credentials) => {
    const result = await loginUser(credentials);
    setToken(getAccessToken());
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (data) => {
    const result = await registerUser(data);
    setToken(getAccessToken());
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setToken(null);
    setUser(null);
  }, []);

  const openAuthModal = useCallback((tab = "login") => {
    setAuthModal({ open: true, tab });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal({ open: false, tab: "login" });
  }, []);

  const updateUser = useCallback((next) => {
    setUser(next);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authModal, openAuthModal, closeAuthModal, setUser: updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
