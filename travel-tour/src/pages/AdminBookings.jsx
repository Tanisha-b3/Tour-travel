import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllBookings, updateBookingStatus } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { CardSkeleton } from "../components/Skeleton";

const ease = [0.22, 1, 0.36, 1];

const STATUS_STYLES = {
  confirmed: { label: "Confirmed", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  pending:   { label: "Pending",   cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  cancelled: { label: "Cancelled", cls: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
};

const STATUSES = ["all", "confirmed", "pending", "cancelled"];

export default function AdminBookings() {
  const { token } = useAuth();
  const { darkMode } = useTheme();
  const addToast = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetchAllBookings(token, { limit: 100 })
      .then((r) => setBookings(r.data || []))
      .catch((e) => addToast("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (q) {
        const blob = `${b.name} ${b.email} ${b.tourName} ${b.phone}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, search]);

  const counts = useMemo(() => {
    const c = { all: bookings.length, confirmed: 0, pending: 0, cancelled: 0 };
    bookings.forEach((b) => { if (c[b.status] != null) c[b.status]++; });
    return c;
  }, [bookings]);

  const changeStatus = async (b, status) => {
    setUpdatingId(b._id);
    try {
      const updated = await updateBookingStatus(b._id, status, token);
      setBookings((arr) => arr.map((x) => (x._id === b._id ? updated : x)));
      addToast("success", `Booking marked as ${status}`);
    } catch (err) {
      addToast("error", err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      {/* Status filter pills */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease }}
        className="flex gap-2 flex-wrap mb-4"
      >
        {STATUSES.map((s) => {
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-semibold capitalize cursor-pointer transition-all border ${
                isActive
                  ? "bg-gradient-to-r from-[#31487A] to-[#31487A] text-white border-transparent shadow-md shadow-[#31487A]/30"
                  : darkMode
                  ? "bg-white/5 text-slate-300 border-white/8 hover:bg-white/10"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s} <span className="ml-1.5 opacity-70">({counts[s] ?? 0})</span>
            </button>
          );
        })}
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05, ease }}
        className="relative mb-5"
      >
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, tour…"
          className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none border ${
            darkMode
              ? "bg-[#1E2E4F] border-white/8 text-white placeholder:text-slate-500 focus:border-[#31487A]/50"
              : "bg-white border-slate-200 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#31487A]/50"
          }`}
        />
      </motion.div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} className="h-24" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={`text-center py-20 rounded-2xl border ${darkMode ? "border-white/5" : "border-slate-200"}`}>
          <span className="text-5xl block mb-3">📅</span>
          <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No bookings match your filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className={`hidden md:block rounded-2xl border overflow-hidden ${darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={darkMode ? "bg-white/3" : "bg-slate-50"}>
                  <tr className={`text-left text-[11px] uppercase tracking-wider ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Tour</th>
                    <th className="px-4 py-3 font-semibold">Dates</th>
                    <th className="px-4 py-3 font-semibold">Guests</th>
                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence initial={false}>
                    {filtered.map((b, i) => {
                      const s = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
                      return (
                        <motion.tr
                          key={b._id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25, delay: i * 0.02, ease }}
                          className={`border-t ${darkMode ? "border-white/5 hover:bg-white/3" : "border-slate-100 hover:bg-slate-50"} transition-colors`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#31487A]/20 to-[#31487A]/20 flex items-center justify-center text-xs font-bold text-[#31487A] shrink-0">
                                {b.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>{b.name}</p>
                                <p className="text-xs text-slate-500 truncate">{b.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className={`px-4 py-3 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                            <p className="truncate max-w-[200px]">{b.tourName}</p>
                            <p className="text-xs text-slate-500">📍 {b.address?.split(",").slice(-1)[0]?.trim() || "—"}</p>
                          </td>
                          <td className={`px-4 py-3 text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                            <p>{b.checkIn}</p>
                            <p className="text-slate-500">→ {b.checkOut}</p>
                          </td>
                          <td className={`px-4 py-3 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>{b.guests}</td>
                          <td className={`px-4 py-3 text-right font-bold ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>
                            ₹{b.total?.toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={b.status}
                              disabled={updatingId === b._id}
                              onChange={(e) => changeStatus(b, e.target.value)}
                              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none ${s.cls}`}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="pending">Pending</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            <AnimatePresence initial={false}>
              {filtered.map((b, i) => {
                const s = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
                return (
                  <motion.div
                    key={b._id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.02, ease }}
                    className={`p-4 rounded-2xl border ${darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"}`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>{b.name}</p>
                        <p className="text-xs text-slate-500 truncate">{b.tourName}</p>
                      </div>
                      <p className="text-sm font-extrabold text-[#0a0f1e] dark:text-white shrink-0">₹{b.total?.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <span>📅 {b.checkIn} → {b.checkOut}</span>
                      <span>👥 {b.guests} guest{b.guests !== 1 ? "s" : ""}</span>
                    </div>
                    <select
                      value={b.status}
                      disabled={updatingId === b._id}
                      onChange={(e) => changeStatus(b, e.target.value)}
                      className={`w-full text-[11px] font-semibold px-2.5 py-1.5 rounded-full border cursor-pointer outline-none ${s.cls}`}
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
