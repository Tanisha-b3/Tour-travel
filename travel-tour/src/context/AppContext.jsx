import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = (destination) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === destination.id);
      if (exists) return prev.filter((item) => item.id !== destination.id);
      return [...prev, destination];
    });
  };

  const isWishlisted = (id) => wishlist.some((item) => item.id === id);

  return (
    <AppContext.Provider
      value={{ wishlist, toggleWishlist, isWishlisted }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
