import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, getMe } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"));
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState({ open: false, tab: "login" });

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    getMe(token)
      .then((u) => setUser(u))
      .catch(() => {
        localStorage.removeItem("auth_token");
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (credentials) => {
    const result = await loginUser(credentials);
    localStorage.setItem("auth_token", result.token);
    setToken(result.token);
    setUser(result.user);
    return result;
  }, []);

  const register = useCallback(async (data) => {
    const result = await registerUser(data);
    localStorage.setItem("auth_token", result.token);
    setToken(result.token);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  }, []);

  const openAuthModal = useCallback((tab = "login") => {
    setAuthModal({ open: true, tab });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal({ open: false, tab: "login" });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, authModal, openAuthModal, closeAuthModal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
