import { useState, useEffect, useRef } from "react";
import { Link, useLocation, NavLink } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/destinations", label: "Destinations" },
  { to: "/tours", label: "Tours" },
];

const DRAWER_LINKS = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/destinations", label: "Destinations", icon: "🗺️" },
  { to: "/tours", label: "Tours", icon: "🧳" },
  { to: "/wishlist", label: "Wishlist", icon: "♡", count: true },
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
  const [isOpen, setIsOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location                = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { wishlist } = useApp();
  const { user, logout, authModal, openAuthModal, closeAuthModal } = useAuth();
  const wishCount = useCountUp(wishlist.length);
  const userMenuRef = useRef(null);

  const isHome      = location.pathname === "/";
  const transparent = isHome && !scrolled;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => { setIsOpen(false); setUserMenuOpen(false); }, [location]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const fn = (e) => { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); };
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
      ? isActive ? "text-white" : "text-slate-400 hover:text-white"
      : isActive ? "text-[#0a0f1e]" : "text-slate-500 hover:text-[#0a0f1e]";
    const bg = isActive
      ? transparent
        ? "bg-white/10"
        : darkMode ? "bg-white/6" : "bg-[#0a0f1e]/5"
      : "hover:bg-black/5 dark:hover:bg-white/4";
    return `${base} ${color} ${bg}`;
  };

  const drawerVariants = {
    hidden:  { x: "100%", opacity: 0.5 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 32 } },
    exit:    { x: "100%", opacity: 0, transition: { duration: 0.22, ease: "easeIn" } },
  };
  const stagger = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.08 } },
  };
  const slideIn = {
    hidden:  { x: 24, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 340, damping: 26 } },
  };

  const navBg = transparent
    ? "bg-transparent py-4"
    : darkMode
    ? "bg-[#05101f]/85 backdrop-blur-2xl py-3 shadow-[0_1px_0_rgba(255,255,255,0.05)]"
    : "bg-white/80 backdrop-blur-2xl py-3 shadow-[0_1px_0_rgba(0,0,0,0.07)]";

  return (
    <>
      {/* Scroll progress bar */}
      {!transparent && (
        <motion.div
          style={{ scaleX, transformOrigin: "left" }}
          className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-gradient-to-r from-[#38bdf8] via-[#60a5fa] to-[#38bdf8]"
        />
      )}

      <motion.nav
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
      >
        {/* 
          FIX 1: Removed conditional mr-12 on logo — it caused uneven centering on home page.
          FIX 2: Use px-4 sm:px-6 for consistent edge breathing room on small screens.
        */}
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
                className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#38bdf8]"
              />
            </motion.div>
            <span
              className={`text-[17px] sm:text-[19px] font-black tracking-tight transition-opacity ${
                transparent ? "text-white" : darkMode ? "text-white" : "text-[#0a0f1e]"
              }`}
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "-0.01em" }}
            >
              Air<span className="bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] bg-clip-text text-transparent">venture</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={linkCls}>
                {label}
              </NavLink>
            ))}

            <span className={`w-px h-4 mx-2 ${transparent ? "bg-white/20" : darkMode ? "bg-white/10" : "bg-slate-200"}`} />

            {user ? (
              <div className="relative" ref={userMenuRef}>
                <motion.button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
                    transparent ? "hover:bg-white/10" : darkMode ? "hover:bg-white/6" : "hover:bg-[#0a0f1e]/5"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#60a5fa] flex items-center justify-center text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-sm font-medium hidden lg:inline ${
                    transparent ? "text-white" : darkMode ? "text-white" : "text-[#0a0f1e]"
                  }`}>
                    {user.name.split(" ")[0]}
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                    className={`w-3.5 h-3.5 transition-transform ${userMenuOpen ? "rotate-180" : ""} ${
                      transparent ? "text-white/60" : darkMode ? "text-slate-400" : "text-slate-500"
                    }`}>
                    <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                  </svg>
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 top-full mt-2 w-52 rounded-xl shadow-xl border overflow-hidden ${
                        darkMode ? "bg-[#0c1829] border-white/10" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className={`px-4 py-3 border-b ${darkMode ? "border-white/8" : "border-slate-100"}`}>
                        <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>{user.name}</p>
                        <p className={`text-xs mt-0.5 truncate ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{user.email}</p>
                      </div>
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer border-none ${
                          darkMode ? "bg-transparent text-slate-300 hover:bg-white/5 hover:text-white" : "bg-transparent text-slate-600 hover:bg-slate-50 hover:text-[#0a0f1e]"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
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
                      ? "text-white bg-white/10 hover:bg-white/20"
                      : darkMode
                      ? "text-white bg-white/8 hover:bg-white/12"
                      : "text-[#0a0f1e] bg-[#0a0f1e]/5 hover:bg-[#0a0f1e]/10"
                  }`}
                >
                  Login
                </button>
              </motion.div>
            )}

            {user && (
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                <Link
                  to="/wishlist"
                  aria-label={`Wishlist (${wishCount} items)`}
                  className={`relative p-2.5 rounded-xl flex items-center justify-center transition-colors ${
                    transparent ? "hover:bg-white/10" : darkMode ? "hover:bg-white/6" : "hover:bg-[#0a0f1e]/5"
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
                      wishCount > 0 ? "text-rose-400" : transparent ? "text-white/80" : darkMode ? "text-slate-400" : "text-slate-500"
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
                transparent ? "hover:bg-white/10 text-white/80"
                : darkMode ? "text-amber-300 hover:bg-white/6"
                : "text-slate-500 hover:bg-[#0a0f1e]/5"
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {darkMode ? (
                  <motion.svg key="sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="w-[17px] h-[17px]"
                    initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.25 }}>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </motion.svg>
                ) : (
                  <motion.svg key="moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="w-[17px] h-[17px]"
                    initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.25 }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </motion.svg>
                )}
              </AnimatePresence>
            </motion.button>

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
                    background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 45%, #60a5fa 100%)",
                    boxShadow: "0 6px 28px rgba(14,165,233,0.35)",
                  }}
                >
                  <span className="relative z-10">Book Now</span>
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                    className="w-3.5 h-3.5 relative z-10"
                    animate={{ x: [0, 2, 0] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                  </motion.svg>
                  <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-white/20 skew-x-12 transition-transform duration-500 pointer-events-none" />
                </Link>
              </motion.div>
            )}
          </div>

          {/* ── Mobile controls ──
            FIX 3: gap-1 (was gap-0.5) — slightly more breathing room between icon buttons.
            FIX 4: Removed conditional `mr-10` from hamburger — it was pushing controls
                   off-screen on the home page. The logo no longer uses `mr-12` either,
                   so justify-between handles the layout correctly on all pages.
          */}
          <div className="flex items-center gap-1 md:hidden">

            {/* Wishlist */}
            <Link
              to="/wishlist"
              aria-label={`Wishlist (${wishCount} items)`}
              className={`relative w-11 h-11 flex items-center justify-center rounded-xl ${
                transparent ? "text-white/80" : darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill={wishCount > 0 ? "currentColor" : "none"} stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                className={`w-[19px] h-[19px] ${wishCount > 0 ? "text-rose-400" : ""}`}>
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
              <AnimatePresence>
                {wishCount > 0 && (
                  <motion.span key="mb" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute top-1 right-1 w-[16px] h-[16px] bg-rose-400 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {wishCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {/* Dark toggle */}
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className={`w-11 h-11 flex items-center justify-center rounded-xl ${
                transparent ? "text-white/80" : darkMode ? "text-amber-300" : "text-slate-500"
              }`}
            >
              {darkMode
                ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              }
            </button>

            {/* Hamburger
              FIX 5: Removed conditional `mr-10 isHome` — this was the main offender,
                     adding 40px right margin that slid the button partly off-screen and
                     caused the drawer to be misaligned on iOS Safari.
            */}
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
                      i === 0 ? (isOpen ? { rotate: 45, y: 7 }      : { rotate: 0, y: 0 }) :
                      i === 1 ? (isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }) :
                                (isOpen ? { rotate: -45, y: -7 }    : { rotate: 0, y: 0 })
                    }
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className={`block h-[2px] w-5 rounded-full origin-center ${
                      transparent ? "bg-white" : darkMode ? "bg-white" : "bg-slate-700"
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
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer
        FIX 6: Removed `mr-10 isHome` from drawer — was clipping the panel on home page.
        FIX 7: Added `padding-right: env(safe-area-inset-right)` via inline style so content
               clears the notch/Dynamic Island on right-handed iPhone orientations.
        FIX 8: `right-0` anchors the drawer flush to the viewport edge on all screen sizes.
      */}
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
            className={`fixed top-0 right-0 z-[60] w-[300px] max-w-[90vw] md:hidden flex flex-col overflow-hidden ${
              darkMode ? "bg-[#060f1d]" : "bg-[#fafafa]"
            } shadow-2xl`}
          >
            {/* Ambient blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full opacity-20"
                style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)" }} />
              <div className="absolute -bottom-24 -left-16 w-48 h-48 rounded-full opacity-15"
                style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }} />
            </div>

            {/* Drawer header */}
            <div className={`relative z-10 flex items-center justify-between px-4 py-3.5 border-b ${
              darkMode ? "border-white/8" : "border-slate-100"
            }`}>
              <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-2 no-underline">
                <span className="text-[18px]">✈️</span>
                <span
                  className={`text-[17px] font-black tracking-tight ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  Air<span className="bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] bg-clip-text text-transparent">venture</span>
                </span>
              </Link>
              <motion.button
                onClick={() => setIsOpen(false)}
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.88 }}
                transition={{ duration: 0.2 }}
                aria-label="Close menu"
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  darkMode ? "text-slate-400 hover:bg-white/8 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                } transition-colors`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </motion.button>
            </div>

            {/* Drawer links */}
            <motion.nav
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="relative z-10 flex flex-col gap-1 px-3 py-3 flex-1 overflow-y-auto"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {DRAWER_LINKS.filter((item) => user || item.to !== "/wishlist").map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <motion.div key={item.label} variants={slideIn}>
                    <Link
                      to={item.to}
                      className={`relative flex items-center gap-3.5 px-4 min-h-[52px] rounded-xl font-medium text-base transition-all no-underline overflow-hidden group/link ${
                        isActive
                          ? darkMode
                            ? "text-white bg-white/8"
                            : "text-[#0a0f1e] bg-[#0a0f1e]/6"
                          : darkMode
                          ? "text-slate-400 hover:text-white hover:bg-white/5"
                          : "text-slate-500 hover:text-[#0a0f1e] hover:bg-[#0a0f1e]/4"
                      }`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="drawer-active"
                          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-[#38bdf8] to-[#60a5fa]"
                        />
                      )}
                      <span className="text-[18px] leading-none">{item.icon}</span>
                      <span className="flex-1">{item.label}</span>
                      {item.count && wishCount > 0 && (
                        <motion.span
                          key={wishCount}
                          initial={{ scale: 0.6 }} animate={{ scale: 1 }}
                          className="min-w-[20px] h-5 bg-gradient-to-br from-rose-400 to-rose-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-1 shadow"
                        >
                          {wishCount}
                        </motion.span>
                      )}
                      {!isActive && (
                        <motion.svg
                          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                          className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover/link:opacity-40 group-hover/link:translate-x-0 transition-all duration-200"
                        >
                          <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </motion.svg>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </motion.nav>

            {/* Drawer footer CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4, ease }}
              className={`relative z-10 px-4 pt-4 border-t ${darkMode ? "border-white/8" : "border-slate-100"}`}
              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
            >
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#60a5fa] flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold truncate ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>{user.name}</p>
                      <p className={`text-xs truncate ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-full font-semibold text-[15px] cursor-pointer border-none"
                    style={{
                      background: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
                      boxShadow: "0 6px 20px rgba(239,68,68,0.3)",
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    onClick={() => { openAuthModal("login"); setIsOpen(false); }}
                    className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-full font-semibold no-underline text-[15px] shadow-lg transition-all active:scale-95 cursor-pointer border-none"
                    style={{
                      background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 50%, #60a5fa 100%)",
                      boxShadow: "0 8px 28px rgba(14,165,233,0.3)",
                    }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { openAuthModal("signup"); setIsOpen(false); }}
                    className={`w-full py-3 rounded-full font-semibold text-[15px] cursor-pointer border-none transition-colors ${
                      darkMode ? "bg-white/8 text-white hover:bg-white/12" : "bg-[#0a0f1e]/5 text-[#0a0f1e] hover:bg-[#0a0f1e]/10"
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