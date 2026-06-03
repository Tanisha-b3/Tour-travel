import { useState, useEffect, useRef } from "react";
import { Link, useLocation, NavLink } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";

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

/* ─── tiny hook: animated counter ─── */
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
  const location                = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { wishlist } = useApp();
  const wishCount = useCountUp(wishlist.length);

  const isHome      = location.pathname === "/";
  const transparent = isHome && !scrolled;

  /* scroll detection */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* close drawer on route change */
  useEffect(() => { setIsOpen(false); }, [location]);

  /* lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* nav progress bar */
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  /* ─ link class ─ */
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

  /* ─ animation variants ─ */
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
      {/* ── Scroll progress bar ── */}
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
        <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">

          {/* ── Logo ── */}
          <Link to="/" className={`flex items-center gap-2 no-underline group shrink-0 ${isHome ? "mr-12" : ""}`} aria-label="Airventure home">
            <motion.div
              whileHover={{ rotate: 18, scale: 1.18 }}
              transition={{ type: "spring", stiffness: 420, damping: 14 }}
              className="relative"
            >
              <span className="text-[17px] sm:text-[20px] block leading-none">✈️</span>
              {/* ping dot */}
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

          {/* ── Desktop nav ── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={linkCls}>
                {label}
              </NavLink>
            ))}

            {/* Divider */}
            <span className={`w-px h-4 mx-2 ${transparent ? "bg-white/20" : darkMode ? "bg-white/10" : "bg-slate-200"}`} />

            {/* Wishlist */}
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

            {/* Dark mode toggle */}
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

            {/* CTA */}
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
                {/* shine sweep */}
                <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full bg-white/20 skew-x-12 transition-transform duration-500 pointer-events-none" />
              </Link>
            </motion.div>
          </div>

          {/* ── Mobile controls ── */}
          {/* FIX: gap-0.5 (was gap-1.5) so controls don't push logo; each button has its own generous touch target */}
          <div className="flex items-center gap-0.5 md:hidden">

            {/* Wishlist — 44×44 touch target */}
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

            {/* Dark toggle — 44×44 touch target */}
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

            {/* Hamburger — 44×44 touch target, uniform bar widths */}
            <button
              className={`w-11 h-11 flex items-center justify-center rounded-xl cursor-pointer border-none bg-transparent ${isHome ? "mr-10" : ""}`}
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
                    /* FIX: all bars same width (w-5) — previously middle was w-4, looked uneven */
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

      {/* ── Backdrop ── */}
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

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="drawer"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ height: "100dvh" }}
            className={`fixed top-0 right-0 z-[60] w-[300px] max-w-[90vw] md:hidden flex flex-col overflow-hidden ${
              darkMode ? "bg-[#060f1d]" : "bg-[#fafafa]"
            } shadow-2xl ${isHome ? "mr-10" : ""}` }
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
              {/* FIX: close button is 40×40 for easy tapping */}
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
              {DRAWER_LINKS.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <motion.div key={item.label} variants={slideIn}>
                    <Link
                      to={item.to}
                      /* FIX: min-h-[52px] ensures all links meet 44px tap target; text-base for readability */
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
                      {/* Active left accent */}
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
                      {/* Hover arrow */}
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
              /* FIX: uses padding-bottom with safe-area-inset so CTA clears home indicator on iPhone */
              className={`relative z-10 px-4 pt-4 border-t ${darkMode ? "border-white/8" : "border-slate-100"}`}
              style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
            >
              <Link
                to="/tours"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 text-white py-4 rounded-full font-semibold no-underline text-[15px] shadow-lg transition-all active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 50%, #60a5fa 100%)",
                  boxShadow: "0 8px 28px rgba(14,165,233,0.3)",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Book Now
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                </svg>
              </Link>
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}