import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import AdminSidebar from "./AdminSidebar";
import { useTheme } from "../context/ThemeContext";

const ease = [0.22, 1, 0.36, 1];

const TITLES = {
  "/admin":                { title: "Dashboard",    sub: "Overview of your platform" },
  "/admin/destinations":   { title: "Destinations", sub: "Manage tours and packages" },
  "/admin/destinations/new":  { title: "Add Destination", sub: "Create a new tour package" },
  "/admin/testimonials":   { title: "Testimonials", sub: "Curate customer reviews" },
  "/admin/bookings":       { title: "Bookings",     sub: "View and manage reservations" },
};

function pageTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/admin/destinations/")) return { title: "Edit Destination", sub: "Update tour details" };
  return { title: "Admin", sub: "" };
}

export default function AdminLayout() {
  const { darkMode } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { title, sub } = pageTitle(location.pathname);

  return (
    <div className={`min-h-screen flex ${darkMode ? "bg-[#31487A]" : "bg-slate-50"}`}>
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
          darkMode ? "bg-[#31487A]/85 border-white/8" : "bg-white/85 border-slate-200"
        }`}>
          <div className="flex items-center gap-3 px-5 sm:px-8 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className={`lg:hidden w-10 h-10 rounded-xl flex items-center justify-center ${
                darkMode ? "text-slate-300 hover:bg-white/5" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <motion.h1
                key={title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease }}
                className={`text-xl sm:text-2xl font-extrabold leading-tight truncate ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                {title}
              </motion.h1>
              {sub && (
                <motion.p
                  key={sub}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                  className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5"
                >
                  {sub}
                </motion.p>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-5 sm:p-8 max-w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
