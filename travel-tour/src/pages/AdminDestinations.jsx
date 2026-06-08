import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchDestinations, deleteDestination } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { CardSkeleton } from "../components/Skeleton";

const ease = [0.22, 1, 0.36, 1];

const TYPE_TONES = {
  beach:     "bg-sky-500/10 text-sky-500",
  cultural:  "bg-violet-500/10 text-violet-500",
  adventure: "bg-orange-500/10 text-orange-500",
  luxury:    "bg-amber-500/10 text-amber-500",
};

export default function AdminDestinations() {
  const { token } = useAuth();
  const { darkMode } = useTheme();
  const addToast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchDestinations({ limit: 100 })
      .then((r) => setItems(r.data || []))
      .catch((e) => addToast("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const types = useMemo(() => {
    const set = new Set(items.map((i) => i.type).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (type !== "all" && i.type !== type) return false;
      if (q && !(i.name.toLowerCase().includes(q) || i.location.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, search, type]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDestination(pendingDelete.id, token);
      addToast("success", `Deleted "${pendingDelete.name}"`);
      setItems((arr) => arr.filter((i) => i.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      addToast("error", err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease }}
        className={`flex flex-col sm:flex-row gap-3 mb-5 p-3 sm:p-4 rounded-2xl border ${
          darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
        }`}
      >
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destinations…"
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none border transition-colors ${
              darkMode
                ? "bg-white/5 border-white/8 text-white placeholder:text-slate-500 focus:border-[#31487A]/50"
                : "bg-slate-50 border-slate-200 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#31487A]/50"
            }`}
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={`px-3 py-2.5 rounded-xl text-sm font-semibold border outline-none cursor-pointer ${
            darkMode
              ? "bg-white/5 border-white/8 text-white"
              : "bg-slate-50 border-slate-200 text-[#0a0f1e]"
          }`}
        >
          {types.map((t) => (
            <option key={t} value={t} className={darkMode ? "bg-[#1E2E4F]" : ""}>
              {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <Link
          to="/admin/destinations/new"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-[#31487A]/30 transition-shadow no-underline text-center"
          style={{ background: "linear-gradient(135deg, #31487A 0%, #31487A 100%)" }}
        >
          + New Destination
        </Link>
      </motion.div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState darkMode={darkMode} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((d, i) => (
              <motion.article
                key={d.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93 }}
                transition={{ duration: 0.35, delay: i * 0.03, ease }}
                className={`group rounded-2xl overflow-hidden border ${
                  darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
                } shadow-[0_4px_18px_rgba(49,72,122,0.04)] hover:shadow-[0_10px_30px_rgba(49,72,122,0.12)] transition-shadow`}
              >
                <div className="relative h-[160px] overflow-hidden bg-slate-200">
                  <img
                    src={d.image}
                    alt={d.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <span className={`absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ${TYPE_TONES[d.type] || "bg-slate-500/10 text-slate-500"}`}>
                    {d.type}
                  </span>
                  <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#0a0f1e] text-xs font-extrabold px-2.5 py-1 rounded-full">
                    ₹{d.price.toLocaleString()}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className={`text-base font-bold leading-tight mb-0.5 ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>
                    {d.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                    <span>📍</span> {d.location} · {d.duration}
                  </p>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span>★ {d.rating}</span>
                    <span>{d.facilities?.length || 0} facilities</span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                    <Link
                      to={`/admin/destinations/${d.id}`}
                      className={`flex-1 text-center py-2 rounded-lg text-xs font-semibold transition-colors no-underline ${
                        darkMode ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/tour/${d.id}`}
                      className="flex-1 text-center py-2 rounded-lg text-xs font-semibold bg-[#31487A]/10 text-[#31487A] hover:bg-[#31487A]/20 transition-colors no-underline"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => setPendingDelete(d)}
                      aria-label="Delete"
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer border-none"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete destination?"
        message={pendingDelete ? `"${pendingDelete.name}" will be permanently removed from your catalog.` : ""}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}

function EmptyState({ darkMode }) {
  return (
    <div className={`text-center py-20 rounded-2xl border ${darkMode ? "border-white/5" : "border-slate-200"}`}>
      <span className="text-6xl block mb-4">🗺️</span>
      <h3 className={`text-lg font-bold mb-1 ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>No destinations found</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your filters, or create a new destination.</p>
    </div>
  );
}
