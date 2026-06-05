import { NavLink, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const NAV_ITEMS = [
  { to: "/admin",            label: "Dashboard",    icon: "📊", end: true },
  { to: "/admin/destinations", label: "Destinations", icon: "🗺️" },
  { to: "/admin/testimonials", label: "Testimonials", icon: "💬" },
  { to: "/admin/bookings",   label: "Bookings",     icon: "📅" },
];

const ease = [0.22, 1, 0.36, 1];

export default function AdminSidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();

  const linkCls = ({ isActive }) =>
    `relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors no-underline ${
      isActive
        ? darkMode
          ? "bg-gradient-to-r from-[#31487A]/20 to-[#31487A]/10 text-white"
          : "bg-gradient-to-r from-[#31487A]/15 to-[#31487A]/10 text-[#0a0f1e]"
        : darkMode
        ? "text-slate-400 hover:bg-white/5 hover:text-white"
        : "text-slate-600 hover:bg-[#0a0f1e]/5 hover:text-[#0a0f1e]"
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-[280px] z-50 lg:z-auto shrink-0 transition-transform duration-300 border-r flex flex-col ${
          darkMode ? "bg-[#07111f] border-white/8" : "bg-white border-slate-200"
        } ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className={`flex items-center justify-between px-5 py-5 border-b ${darkMode ? "border-white/8" : "border-slate-100"}`}>
          <Link to="/" onClick={onClose} className="flex items-center gap-2 no-underline">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#31487A] to-[#31487A] flex items-center justify-center text-white text-lg">
              🛡️
            </div>
            <div>
              <p className={`text-[15px] font-extrabold leading-none ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                Admin Panel
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mt-0.5">Airventure</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className={`lg:hidden w-9 h-9 rounded-lg flex items-center justify-center ${darkMode ? "text-slate-400 hover:bg-white/5" : "text-slate-500 hover:bg-slate-100"}`}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 px-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Management
          </p>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className={linkCls}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="admin-active"
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-[#31487A] to-[#31487A]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 mt-6 px-3 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Site
          </p>
          <Link
            to="/"
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold no-underline ${
              darkMode ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-600 hover:bg-[#0a0f1e]/5 hover:text-[#0a0f1e]"
            }`}
          >
            <span className="text-lg leading-none">🌐</span>
            <span className="flex-1">View Site</span>
          </Link>
        </nav>

        {/* User card */}
        <div className={`p-4 border-t ${darkMode ? "border-white/8" : "border-slate-100"}`}>
          <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-50"}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#31487A] to-[#31487A] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold truncate ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>{user?.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">Administrator</p>
            </div>
            <button
              onClick={toggleDarkMode}
              aria-label="Toggle theme"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                darkMode ? "text-amber-300 hover:bg-white/5" : "text-slate-500 hover:bg-[#0a0f1e]/5"
              }`}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
