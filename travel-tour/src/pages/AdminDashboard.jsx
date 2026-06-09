import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchAdminStats, fetchAllBookings } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import StatCard from "../components/StatCard";
import { CardSkeleton } from "../components/Skeleton";

const ease = [0.22, 1, 0.36, 1];

const STATUS_STYLES = {
  confirmed: { label: "Confirmed", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  pending:   { label: "Pending",   cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  cancelled: { label: "Cancelled", cls: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const { darkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([fetchAdminStats(token), fetchAllBookings(token)])
      .then(([s, b]) => {
        if (!mounted) return;
        setStats(s);
        setBookings(b.data || []);
      })
      .catch(console.error)
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [token]);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const { counts, revenue, byStatus } = stats;
  const recent = bookings.slice(0, 6);

  return (
    <div>
      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🗺️" label="Destinations" value={counts.destinations} tone="sky" delay={0} />
        <StatCard icon="📅" label="Total Bookings" value={counts.bookings} tone="emerald" delay={0.05} />
        <StatCard icon="💬" label="Testimonials" value={counts.testimonials} tone="violet" delay={0.1} />
        <StatCard icon="💰" label="Total Revenue" value={`\u20B9${revenue.toLocaleString()}`} tone="amber" delay={0.15} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Status breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className={`rounded-2xl p-6 border ${darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"}`}
        >
          <h3 className={`text-base font-bold mb-4 ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>Booking Status</h3>
          <div className="space-y-3">
            {["confirmed", "pending", "cancelled"].map((s, i) => {
              const c = byStatus[s] || 0;
              const pct = counts.bookings ? Math.round((c / counts.bookings) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className={`font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{STATUS_STYLES[s].label}</span>
                    <span className="text-slate-500">{c} · {pct}%</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${darkMode ? "bg-white/5" : "bg-slate-100"}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 * i, ease }}
                      className={`h-full rounded-full ${
                        s === "confirmed" ? "bg-gradient-to-r from-emerald-400 to-teal-500" :
                        s === "pending" ? "bg-gradient-to-r from-amber-400 to-orange-500" :
                        "bg-gradient-to-r from-rose-400 to-red-500"
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-5 border-t border-slate-200/60 dark:border-white/8">
            <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">Quick actions</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/admin/destinations/new" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#31487A]/10 text-[#31487A] hover:bg-[#31487A]/20 transition-colors no-underline">
                + New Destination
              </Link>
              <Link to="/admin/bookings" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors no-underline">
                View Bookings
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Recent bookings */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease }}
          className={`lg:col-span-2 rounded-2xl p-6 border ${darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>Recent Bookings</h3>
            <Link to="/admin/bookings" className="text-xs font-semibold text-[#31487A] hover:underline no-underline">View all →</Link>
          </div>
          {recent.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              <span className="block text-3xl mb-2">📭</span>
              No bookings yet.
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((b) => {
                const s = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
                return (
                  <div
                    key={b._id}
                    className={`flex items-center gap-4 p-3 rounded-xl border ${
                      darkMode ? "border-white/5 hover:bg-white/5" : "border-slate-100 hover:bg-slate-50"
                    } transition-colors`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#31487A]/20 to-[#31487A]/20 flex items-center justify-center text-sm font-bold text-[#31487A] shrink-0">
                      {b.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold truncate ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>{b.name}</p>
                      <p className="text-xs text-slate-500 truncate">{b.tourName} · {b.guests} guest{b.guests !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                       <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>₹{b.total?.toLocaleString()}</p>
                      <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
