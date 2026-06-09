// ─── COLOUR TOKENS ──────────────────────────────────────────────────────────
// Brand blues
//   darkest:   #1E3259   (deep navy — shadows, dark bg accents)
//   core:      #31487A   (primary brand blue)
//   mid:       #4B6DA8   (hover states, lighter accents)
//   light:     #7A99CC   (muted icons, borders in dark mode)
//   pale:      #B8CCEB   (subtle fills, disabled states)
//   surface:   #EBF0FA   (blue-tinted white bg for light mode)
//
// Light mode bg:  #FFFFFF primary / #F4F7FD secondary (slight blue tint)
// Dark mode bg:   #0B1221 base / #111C30 surface / #192338 elevated
// ────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { Link, useLocation, NavLink } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

// Links visible to ALL users (both logged out and logged in)
const PUBLIC_NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/destinations", label: "Destinations" },
  { to: "/tours", label: "Tours" },
];

// Links visible ONLY to logged-in users (shown after login on desktop)
const AUTHENTICATED_NAV_LINKS = [
  { to: "/travel-planner", label: "AI Planner", highlight: true },
  // { to: "/explore-map", label: "Map" },
  
];

// Get desktop nav links based on authentication status
const getDesktopNavLinks = (isAuthenticated) => {
  const links = [...PUBLIC_NAV_LINKS];
  if (isAuthenticated) {
    links.push(...AUTHENTICATED_NAV_LINKS);
  }
  return links;
};

// Drawer links configuration with visibility flags
const DRAWER_LINKS = [
  { type: "section", label: "Main" },
  { to: "/", label: "Home", icon: "🏠", public: true, end: true },
  { to: "/destinations", label: "Destinations", icon: "🗺️", public: true },
  { to: "/tours", label: "Tours", icon: "🧳", public: true },
  { type: "section", label: "Discover", authOnly: true },
  { to: "/travel-planner", label: "AI Travel Planner", icon: "✨", authOnly: true },
  { to: "/chat", label: "Chat Assistant", icon: "💬", authOnly: true },
  { to: "/recommendations", label: "For You", icon: "🎯", authOnly: true },
  // { to: "/explore-map", label: "Explore Map", icon: "🧭", authOnly: true },
  { type: "section", label: "Account", authOnly: true },
  { to: "/wishlist", label: "Wishlist", icon: "♡", count: true, authOnly: true },
  { to: "/my-bookings", label: "My Bookings", icon: "📅", authOnly: true },
  { to: "/profile", label: "My Profile", icon: "👤", authOnly: true },
];

const ease = [0.22, 1, 0.36, 1];

function useCountUp(target) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    if (prev.current === target) return;
    prev.current = target;
    setVal(target);
  }, [target]);
  return val;
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { wishlist } = useApp();
  const { user, logout, authModal, openAuthModal, closeAuthModal } = useAuth();
  const wishCount = useCountUp(wishlist.length);
  const userMenuRef = useRef(null);

  const isHome = location.pathname === "/";
  const transparent = isHome && !scrolled;
  const isAuthenticated = !!user;

  // Get the appropriate nav links for desktop based on auth status
  const desktopNavLinks = getDesktopNavLinks(isAuthenticated);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setUserMenuOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const fn = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [userMenuOpen]);

  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const linkCls = ({ isActive }) => {
    const base =
      "relative font-medium text-[13px] tracking-wide transition-colors duration-200 px-3.5 py-2 rounded-lg inline-block";
    const color = transparent
      ? isActive ? "text-white" : "text-white/75 hover:text-white"
      : darkMode
      ? isActive ? "text-white" : "text-[#7A99CC] hover:text-white"
      : isActive ? "text-[#1E3259]" : "text-[#4B6DA8] hover:text-[#1E3259]";
    const bg = isActive
      ? transparent
        ? "bg-white/15"
        : darkMode
          ? "bg-[#31487A]/30"
          : "bg-[#EBF0FA]"
      : transparent
        ? "hover:bg-white/10"
        : darkMode
          ? "hover:bg-[#31487A]/20"
          : "hover:bg-[#EBF0FA]";
    return `${base} ${color} ${bg}`;
  };

  const drawerVariants = {
    hidden: { x: "100%", opacity: 0.5 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 32 } },
    exit: { x: "100%", opacity: 0, transition: { duration: 0.22, ease: "easeIn" } },
  };
  const stagger = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
  };
  const slideIn = {
    hidden: { x: 24, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 340, damping: 26 } },
  };

  const navBg = transparent
    ? "bg-transparent py-4"
    : darkMode
    ? "bg-[#111C30]/90 backdrop-blur-2xl py-3 shadow-[0_1px_0_rgba(75,109,168,0.15)]"
    : "bg-white/90 backdrop-blur-2xl py-3 shadow-[0_1px_0_rgba(49,72,122,0.1)]";

  // Filter drawer links based on authentication status
  const getVisibleDrawerItems = () => {
    const result = [];
    let currentSection = null;
    let hasItemsInSection = false;

    for (const item of DRAWER_LINKS) {
      if (item.type === "section") {
        // Push previous section if it had items
        if (currentSection && hasItemsInSection) {
          result.push(currentSection);
        }
        currentSection = item;
        hasItemsInSection = false;
      } else if (item.public) {
        result.push(item);
        hasItemsInSection = true;
      } else if (item.authOnly && isAuthenticated) {
        result.push(item);
        hasItemsInSection = true;
      }
    }

    return result;
  };

  const visibleDrawerItems = getVisibleDrawerItems();

  return (
    <>
      {/* Scroll progress bar */}
      {!transparent && (
        <motion.div
          style={{ scaleX, transformOrigin: "left" }}
          className="fixed top-0 left-0 right-0 z-[60] h-[2px]"
          style={{
            scaleX,
            transformOrigin: "left",
            background: "linear-gradient(90deg, #1E3259 0%, #31487A 50%, #4B6DA8 100%)",
          }}
        />
      )}

      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex justify-between items-center">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 no-underline group shrink-0"
            aria-label="Airventure home"
          >
            <motion.div
              whileHover={{ rotate: 18, scale: 1.18 }}
              transition={{ type: "spring", stiffness: 420, damping: 14 }}
              className="relative"
            >
              <span className="text-[17px] sm:text-[20px] block leading-none">✈️</span>
              <motion.span
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity }}
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4B6DA8]"
              />
            </motion.div>
            <span
              className={`text-[17px] sm:text-[19px] font-black tracking-tight transition-opacity ${
                transparent ? "text-white" : darkMode ? "text-white" : "text-[#1E3259]"
              }`}
              style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.01em" }}
            >
              Air
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: transparent
                    ? "linear-gradient(135deg, #B8CCEB, #EBF0FA)"
                    : darkMode
                    ? "linear-gradient(135deg, #7A99CC, #B8CCEB)"
                    : "linear-gradient(135deg, #31487A, #4B6DA8)",
                }}
              >
                venture
              </span>
            </span>
          </Link>

          {/* Desktop Navigation - Shows different links based on auth */}
          <div className="hidden md:flex items-center gap-1">
            {desktopNavLinks.map(({ to, label, end, highlight }) => (
              <NavLink key={to} to={to} end={end} className={linkCls}>
                {({ isActive }) => (
                  <>
                    <span className="relative z-10 inline-flex items-center gap-1">
                      {highlight && <span className="text-[10px]">✨</span>}
                      {label}
                    </span>
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute left-3 right-3 -bottom-0.5 h-[2px] rounded-full"
                        style={{
                          background: transparent
                            ? "linear-gradient(90deg, #B8CCEB, #EBF0FA)"
                            : "linear-gradient(90deg, #1E3259, #4B6DA8)",
                        }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}

            <span
              className={`w-px h-4 mx-2 ${
                transparent ? "bg-white/20" : darkMode ? "bg-[#31487A]/50" : "bg-[#B8CCEB]"
              }`}
            />

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                    transparent
                      ? "hover:bg-white/10"
                      : darkMode
                      ? "hover:bg-[#31487A]/20"
                      : "hover:bg-[#EBF0FA]"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      background: "linear-gradient(135deg, #31487A, #4B6DA8)",
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`text-sm font-medium hidden lg:inline ${
                      transparent ? "text-white" : darkMode ? "text-white" : "text-[#1E3259]"
                    }`}
                  >
                    {user.name.split(" ")[0]}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-3.5 h-3.5 transition-transform ${userMenuOpen ? "rotate-180" : ""} ${
                      transparent ? "text-white/60" : darkMode ? "text-[#7A99CC]" : "text-[#4B6DA8]"
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl border overflow-hidden ${
                        darkMode
                          ? "bg-[#111C30] border-[#31487A]/30"
                          : "bg-white border-[#B8CCEB]"
                      }`}
                    >
                      <div
                        className={`px-4 py-3 border-b ${
                          darkMode ? "border-[#31487A]/20" : "border-[#EBF0FA]"
                        }`}
                      >
                        <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-[#1E3259]"}`}>
                          {user.name}
                        </p>
                        <p className={`text-xs mt-0.5 truncate ${darkMode ? "text-[#7A99CC]" : "text-[#4B6DA8]"}`}>
                          {user.email}
                        </p>
                        {user.role === "admin" && (
                          <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                            Admin
                          </span>
                        )}
                      </div>
                      <Link
                        to="/my-bookings"
                        onClick={() => setUserMenuOpen(false)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border-none no-underline ${
                          darkMode
                            ? "bg-transparent text-[#7A99CC] hover:bg-[#31487A]/20 hover:text-white"
                            : "bg-transparent text-[#4B6DA8] hover:bg-[#EBF0FA] hover:text-[#1E3259]"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path
                            fillRule="evenodd"
                            d="M5.75 2a.75.75 0 0 1 .75.75V4h7V2.75a.75.75 0 0 1 1.5 0V4h.25A2.75 2.75 0 0 1 18 6.75v8.5A2.75 2.75 0 0 1 15.25 18H4.75A2.75 2.75 0 0 1 2 15.25v-8.5A2.75 2.75 0 0 1 4.75 4H5V2.75A.75.75 0 0 1 5.75 2Zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        My Bookings
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border-none no-underline ${
                          darkMode
                            ? "bg-transparent text-[#7A99CC] hover:bg-[#31487A]/20 hover:text-white"
                            : "bg-transparent text-[#4B6DA8] hover:bg-[#EBF0FA] hover:text-[#1E3259]"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-7 14a7 7 0 1 1 14 0 1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
                        </svg>
                        My Profile
                      </Link>
                       <Link
                        to="/chat"
                        onClick={() => setUserMenuOpen(false)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border-none no-underline ${
                          darkMode
                            ? "bg-transparent text-[#7A99CC] hover:bg-[#31487A]/20 hover:text-white"
                            : "bg-transparent text-[#4B6DA8] hover:bg-[#EBF0FA] hover:text-[#1E3259]"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path d="M10 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-7 14a7 7 0 1 1 14 0 1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z" />
                        </svg>
                        Chat Assistant
                      </Link>
                      <Link
                        to="/recommendations"
                        onClick={() => setUserMenuOpen(false)}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border-none no-underline ${
                          darkMode
                            ? "bg-transparent text-[#7A99CC] hover:bg-[#31487A]/20 hover:text-white"
                            : "bg-transparent text-[#4B6DA8] hover:bg-[#EBF0FA] hover:text-[#1E3259]"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 015.656 5.656L10 17.657l-6.828-6.828a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Recommendations
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer border-none no-underline ${
                            darkMode
                              ? "bg-transparent text-[#4B6DA8] hover:bg-[#31487A]/20"
                              : "bg-transparent text-[#31487A] hover:bg-[#EBF0FA]"
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path
                              fillRule="evenodd"
                              d="M10 1.75a.75.75 0 0 1 .69.462l1.666 3.95 4.342.42a.75.75 0 0 1 .422 1.31l-3.246 2.84.91 4.349a.75.75 0 0 1-1.115.778L10 13.348l-3.67 1.762a.75.75 0 0 1-1.115-.778l.91-4.35-3.246-2.84a.75.75 0 0 1 .422-1.31l4.342-.42 1.666-3.95A.75.75 0 0 1 10 1.75Z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border-none ${
                          darkMode
                            ? "bg-transparent text-[#7A99CC] hover:bg-[#31487A]/20 hover:text-white"
                            : "bg-transparent text-[#4B6DA8] hover:bg-[#EBF0FA] hover:text-[#1E3259]"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path
                            fillRule="evenodd"
                            d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
                            clipRule="evenodd"
                          />
                          <path
                            fillRule="evenodd"
                            d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <button
                  onClick={() => openAuthModal("login")}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border-none transition-colors ${
                    transparent
                      ? "text-white bg-white/15 hover:bg-white/25"
                      : darkMode
                      ? "text-white bg-[#31487A]/30 hover:bg-[#31487A]/50"
                      : "text-[#1E3259] bg-[#EBF0FA] hover:bg-[#B8CCEB]"
                  }`}
                >
                  Login
                </button>
              </motion.div>
            )}

            {/* Wishlist Icon - Only shown when logged in */}
            {user && (
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                <Link
                  to="/wishlist"
                  aria-label={`Wishlist (${wishCount} items)`}
                  className={`relative p-2.5 rounded-xl flex items-center justify-center transition-colors ${
                    transparent
                      ? "hover:bg-white/10"
                      : darkMode
                      ? "hover:bg-[#31487A]/20"
                      : "hover:bg-[#EBF0FA]"
                  }`}
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill={wishCount > 0 ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-[18px] h-[18px] transition-colors duration-200 ${
                      wishCount > 0
                        ? "text-rose-400"
                        : transparent
                        ? "text-white/80"
                        : darkMode
                        ? "text-[#7A99CC]"
                        : "text-[#4B6DA8]"
                    }`}
                    animate={wishCount > 0 ? { scale: [1, 1.25, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </motion.svg>
                  <AnimatePresence>
                    {wishCount > 0 && (
                      <motion.span
                        key={wishCount}
                        initial={{ scale: 0, y: 4 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-gradient-to-br from-rose-400 to-rose-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold shadow-md px-0.5"
                      >
                        {wishCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            )}

            <motion.button
              onClick={toggleDarkMode}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              className={`relative p-2.5 rounded-xl overflow-hidden transition-colors ${
                transparent
                  ? "hover:bg-white/10 text-white/80"
                  : darkMode
                  ? "text-amber-300 hover:bg-[#31487A]/20"
                  : "text-[#4B6DA8] hover:bg-[#EBF0FA]"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {darkMode ? (
                  <motion.svg
                    key="sun"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-[17px] h-[17px]"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </motion.svg>
                ) : (
                  <motion.svg
                    key="moon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-[17px] h-[17px]"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>

            {user && user.role === "admin" && (
              <motion.div whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to="/admin"
                  title="Admin Panel"
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-[13px] font-semibold no-underline border ${
                    darkMode
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/15"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M10 1.75a.75.75 0 0 1 .69.462l1.666 3.95 4.342.42a.75.75 0 0 1 .422 1.31l-3.246 2.84.91 4.349a.75.75 0 0 1-1.115.778L10 13.348l-3.67 1.762a.75.75 0 0 1-1.115-.778l.91-4.35-3.246-2.84a.75.75 0 0 1 .422-1.31l4.342-.42 1.666-3.95A.75.75 0 0 1 10 1.75Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden xl:inline">Admin</span>
                </Link>
              </motion.div>
            )}

            {/* Book Now Button - Only shown when logged in */}
            {user && (
              <motion.div
                whileHover={{ scale: 1.04, y: -1.5 }}
                whileTap={{ scale: 0.96 }}
                className="ml-1.5"
              >
                <Link
                  to="/tours"
                  className="relative inline-flex items-center gap-1.5 text-white px-5 py-2.5 rounded-full font-semibold no-underline text-[13px] overflow-hidden group/btn"
                  style={{
                    background: "linear-gradient(135deg, #1E3259 0%, #31487A 55%, #4B6DA8 100%)",
                    boxShadow: "0 6px 24px rgba(49,72,122,0.40)",
                  }}
                >
                  <span className="relative z-10">Book Now</span>
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5 relative z-10"
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                      clipRule="evenodd"
                    />
                  </motion.svg>
                  <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-white/15 skew-x-12 transition-transform duration-500 pointer-events-none" />
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-1 md:hidden">
            {/* Wishlist Icon on Mobile - Only shown when logged in */}
            {user && (
              <Link
                to="/wishlist"
                aria-label={`Wishlist (${wishCount} items)`}
                className={`relative w-11 h-11 flex items-center justify-center rounded-xl ${
                  transparent ? "text-white/80" : darkMode ? "text-[#7A99CC]" : "text-[#4B6DA8]"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={wishCount > 0 ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-[19px] h-[19px] ${wishCount > 0 ? "text-rose-400" : ""}`}
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
                <AnimatePresence>
                  {wishCount > 0 && (
                    <motion.span
                      key="mb"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1 right-1 w-[16px] h-[16px] bg-rose-400 text-white text-[9px] rounded-full flex items-center justify-center font-bold"
                    >
                      {wishCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}

            <button
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className={`w-11 h-11 flex items-center justify-center rounded-xl ${
                transparent ? "text-white/80" : darkMode ? "text-amber-300" : "text-[#4B6DA8]"
              }`}
            >
              {darkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-[18px] h-[18px]"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-[18px] h-[18px]"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            <button
              className="w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer border-none bg-transparent"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle navigation"
              aria-expanded={isOpen}
            >
              <div className="flex flex-col gap-[5px]">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={
                      i === 0
                        ? isOpen
                          ? { rotate: 45, y: 7 }
                          : { rotate: 0, y: 0 }
                        : i === 1
                        ? isOpen
                          ? { opacity: 0, scaleX: 0 }
                          : { opacity: 1, scaleX: 1 }
                        : isOpen
                        ? { rotate: -45, y: -7 }
                        : { rotate: 0, y: 0 }
                    }
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className={`block h-[2px] w-5 rounded-full origin-center ${
                      transparent ? "bg-white" : darkMode ? "bg-[#7A99CC]" : "bg-[#31487A]"
                    }`}
                  />
                ))}
              </div>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0B1221]/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{
              height: "100dvh",
              paddingRight: "env(safe-area-inset-right, 0px)",
            }}
            className={`fixed top-0 right-0 z-[60] w-[300px] max-w-[90vw] md:hidden flex flex-col overflow-hidden shadow-2xl ${
              darkMode ? "bg-[#0B1221]" : "bg-white"
            }`}
          >
            {/* Ambient blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div
                className="absolute -top-24 -right-24 w-56 h-56 rounded-full opacity-10"
                style={{ background: "radial-gradient(circle, #4B6DA8, transparent 70%)" }}
              />
              <div
                className="absolute -bottom-24 -left-16 w-48 h-48 rounded-full opacity-10"
                style={{ background: "radial-gradient(circle, #31487A, transparent 70%)" }}
              />
            </div>

            {/* Drawer header */}
            <div
              className={`relative z-10 flex items-center justify-between px-4 py-3.5 border-b ${
                darkMode ? "border-[#31487A]/25" : "border-[#EBF0FA]"
              }`}
            >
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 no-underline"
              >
                <span className="text-[18px]">✈️</span>
                <span
                  className={`text-[17px] font-black tracking-tight ${
                    darkMode ? "text-white" : "text-[#1E3259]"
                  }`}
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Air
                  <span
                    className="bg-clip-text text-transparent"
                    style={{
                      backgroundImage: darkMode
                        ? "linear-gradient(135deg, #7A99CC, #B8CCEB)"
                        : "linear-gradient(135deg, #31487A, #4B6DA8)",
                    }}
                  >
                    venture
                  </span>
                </span>
              </Link>
              <motion.button
                onClick={() => setIsOpen(false)}
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.2 }}
                aria-label="Close menu"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  darkMode
                    ? "text-[#7A99CC] hover:bg-[#31487A]/20 hover:text-white"
                    : "text-[#4B6DA8] hover:bg-[#EBF0FA] hover:text-[#1E3259]"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </motion.button>
            </div>

            {/* Drawer links - filtered based on auth */}
            <motion.nav
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="relative z-10 flex flex-col gap-1 px-3 py-3 flex-1 overflow-y-auto"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {visibleDrawerItems.map((item) => {
                if (item.type === "section") {
                  return (
                    <motion.div
                      key={`sec-${item.label}`}
                      variants={slideIn}
                      className="pt-3 pb-1 px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-[#7A99CC]/60"
                    >
                      {item.label}
                    </motion.div>
                  );
                }
                const isActive = location.pathname === item.to;
                return (
                  <motion.div key={item.label} variants={slideIn}>
                    <Link
                      to={item.to}
                      onClick={() => setIsOpen(false)}
                      className={`relative flex items-center gap-3.5 px-4 min-h-[52px] rounded-xl font-medium text-base transition-all no-underline overflow-hidden group/link ${
                        isActive
                          ? darkMode
                            ? "text-white bg-[#31487A]/30"
                            : "text-[#1E3259] bg-[#EBF0FA]"
                          : darkMode
                          ? "text-[#7A99CC] hover:text-white hover:bg-[#31487A]/15"
                          : "text-[#4B6DA8] hover:text-[#1E3259] hover:bg-[#F4F7FD]"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="drawer-active"
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                          style={{
                            background: "linear-gradient(to bottom, #31487A, #4B6DA8)",
                          }}
                        />
                      )}
                      <span className="text-[18px] leading-none">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {item.count && wishCount > 0 && (
                        <motion.span
                          key={wishCount}
                          initial={{ scale: 0.6 }}
                          animate={{ scale: 1 }}
                          className="min-w-[20px] h-5 bg-gradient-to-br from-rose-400 to-rose-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1 shadow"
                        >
                          {wishCount}
                        </motion.span>
                      )}
                      {!isActive && (
                        <motion.svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                          className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover/link:opacity-40 group-hover/link:translate-x-0 transition-all duration-200"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                            clipRule="evenodd"
                          />
                        </motion.svg>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>

            {/* Drawer footer */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4, ease }}
              className={`relative z-10 px-4 pt-4 border-t ${
                darkMode ? "border-[#31487A]/25" : "border-[#EBF0FA]"
              }`}
              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
            >
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ background: "linear-gradient(135deg, #31487A, #4B6DA8)" }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          darkMode ? "text-white" : "text-[#1E3259]"
                        }`}
                      >
                        {user.name}
                      </p>
                      <p
                        className={`text-xs truncate ${
                          darkMode ? "text-[#7A99CC]" : "text-[#4B6DA8]"
                        }`}
                      >
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-full font-semibold text-[15px] cursor-pointer border-none"
                    style={{
                      background: "linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)",
                      boxShadow: "0 6px 20px rgba(192,57,43,0.3)",
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path
                        fillRule="evenodd"
                        d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
                        clipRule="evenodd"
                      />
                      <path
                        fillRule="evenodd"
                        d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    onClick={() => {
                      openAuthModal("login");
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-full font-semibold text-[15px] cursor-pointer border-none"
                    style={{
                      background: "linear-gradient(135deg, #1E3259 0%, #31487A 55%, #4B6DA8 100%)",
                      boxShadow: "0 8px 28px rgba(49,72,122,0.35)",
                    }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      openAuthModal("signup");
                      setIsOpen(false);
                    }}
                    className={`w-full py-3 rounded-full font-semibold text-[15px] cursor-pointer border-none transition-colors ${
                      darkMode
                        ? "bg-[#31487A]/20 text-[#7A99CC] hover:bg-[#31487A]/30 hover:text-white"
                        : "bg-[#EBF0FA] text-[#31487A] hover:bg-[#B8CCEB]"
                    }`}
                  >
                    Create Account
                  </button>
                </div>
              )}
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      <AuthModal isOpen={authModal.open} onClose={closeAuthModal} initialTab={authModal.tab} />
    </>
  );
}