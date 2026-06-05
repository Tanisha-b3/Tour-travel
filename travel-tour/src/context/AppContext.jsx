import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { fetchWishlist, addWishlistItem, removeWishlistItem, syncWishlist } from "../services/api";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { user, token } = useAuth();
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });
  const syncedRef = useRef(false);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    syncedRef.current = false;
    if (!token || !user) return;

    let cancelled = false;
    (async () => {
      try {
        const localIds = JSON.parse(localStorage.getItem("wishlist") || "[]")
          .map((d) => d?.id)
          .filter(Number.isFinite);

        const server = await fetchWishlist(token);
        const serverIds = (server?.items || []).map((d) => d.id);

        const localOnly = localIds.filter((id) => !serverIds.includes(id));
        const data = localOnly.length
          ? await syncWishlist([...serverIds, ...localOnly], token)
          : server;

        if (cancelled) return;
        setWishlist(data?.items || []);
        syncedRef.current = true;
      } catch {
        if (!cancelled) syncedRef.current = true;
      }
    })();

    return () => { cancelled = true; };
  }, [token, user?.id]);

  const toggleWishlist = useCallback(async (destination) => {
    if (!destination?.id || !Number.isFinite(destination.id)) return;

    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === destination.id);
      if (exists) {
        if (token) removeWishlistItem(destination.id, token).catch(() => {});
        return prev.filter((item) => item.id !== destination.id);
      }
      if (token) addWishlistItem(destination.id, token).catch(() => {});
      return [...prev, destination];
    });
  }, [token]);

  const isWishlisted = useCallback((id) => wishlist.some((item) => item.id === id), [wishlist]);

  return (
    <AppContext.Provider value={{ wishlist, toggleWishlist, isWishlisted }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
