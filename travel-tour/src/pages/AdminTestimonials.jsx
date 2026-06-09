import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { CardSkeleton } from "../components/Skeleton";

const ease = [0.22, 1, 0.36, 1];

const EMPTY = { name: "", avatar: "", location: "", text: "", rating: 5 };

export default function AdminTestimonials() {
  const { token } = useAuth();
  const { darkMode } = useTheme();
  const addToast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchTestimonials({ limit: 100 })
      .then(setItems)
      .catch((e) => addToast("error", e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startEdit = (t) => {
    setEditingId(t._id);
    setForm({
      name: t.name, avatar: t.avatar, location: t.location, text: t.text, rating: t.rating,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.avatar || !form.location || !form.text) {
      addToast("error", "Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateTestimonial(editingId, { ...form, rating: Number(form.rating) }, token);
        setItems((arr) => arr.map((t) => (t._id === editingId ? updated : t)));
        addToast("success", "Testimonial updated");
      } else {
        const created = await createTestimonial({ ...form, rating: Number(form.rating) }, token);
        setItems((arr) => [created, ...arr]);
        addToast("success", "Testimonial added");
      }
      cancelEdit();
    } catch (err) {
      addToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTestimonial(pendingDelete._id, token);
      setItems((arr) => arr.filter((t) => t._id !== pendingDelete._id));
      addToast("success", "Testimonial deleted");
      setPendingDelete(null);
    } catch (err) {
      addToast("error", err.message);
    } finally {
      setDeleting(false);
    }
  };

  const inputCls = (hasError) =>
    `w-full px-3.5 py-2.5 rounded-xl text-sm outline-none border transition-colors ${
      hasError
        ? "border-rose-500/50 bg-rose-500/5"
        : darkMode
        ? "bg-white/5 border-white/8 text-white placeholder:text-slate-500 focus:border-[#31487A]/50"
        : "bg-slate-50 border-slate-200 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#31487A]/50"
    }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-5">
      {/* List */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : items.length === 0 ? (
          <div className={`text-center py-20 rounded-2xl border ${darkMode ? "border-white/5" : "border-slate-200"}`}>
            <span className="text-5xl block mb-3">💬</span>
            <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>No testimonials yet. Add one using the form →</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {items.map((t, i) => (
                <motion.article
                  key={t._id}
                  layout
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.03, ease }}
                  className={`p-5 rounded-2xl border ${
                    darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
                  } shadow-[0_4px_18px_rgba(49,72,122,0.04)]`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <img src={t.avatar} alt={t.name} className="w-11 h-11 rounded-full object-cover bg-slate-200" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>{t.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{t.location}</p>
                    </div>
                    <span className="text-amber-500 text-xs">★ {t.rating}</span>
                  </div>
                  <p className={`text-sm leading-relaxed mb-3 line-clamp-3 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{t.text}</p>
                  <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                    <button
                      onClick={() => startEdit(t)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none ${
                        darkMode ? "bg-white/5 text-slate-300 hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setPendingDelete(t)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 cursor-pointer border-none"
                    >
                      🗑
                    </button>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease }}
        className={`lg:sticky lg:top-[88px] self-start p-5 rounded-2xl border h-fit ${
          darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
        }`}
      >
        <h3 className={`text-base font-bold mb-4 ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>
          {editingId ? "Edit Testimonial" : "Add Testimonial"}
        </h3>

        <div className="space-y-3.5">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Customer name *" className={inputCls(!form.name)} />
          <input value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} placeholder="Avatar URL *" className={inputCls(!form.avatar)} />
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location *" className={inputCls(!form.location)} />
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            rows={3}
            placeholder="Review text *"
            className={inputCls(!form.text) + " resize-none"}
          />
          <div>
            <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Rating</label>
            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              className={inputCls(false) + " cursor-pointer"}
            >
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n} className={darkMode ? "bg-[#1E2E4F]" : ""}>{n} star{n !== 1 ? "s" : ""}</option>)}
            </select>
          </div>
        </div>

        {form.avatar && (
          <div className="mt-3 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-white/8">
            <img src={form.avatar} alt="" className="w-9 h-9 rounded-full object-cover bg-slate-200" onError={(e) => e.currentTarget.style.display = "none"} />
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Avatar preview</p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border ${
                darkMode ? "border-white/8 text-slate-300 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-[#31487A]/30 transition-shadow disabled:opacity-60 cursor-pointer border-none"
            style={{ background: "linear-gradient(135deg, #31487A 0%, #31487A 100%)" }}
          >
            {submitting ? "Saving…" : editingId ? "Save Changes" : "Add Testimonial"}
          </button>
        </div>
      </motion.form>

      <ConfirmDialog
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete testimonial?"
        message={pendingDelete ? `The review by "${pendingDelete.name}" will be removed.` : ""}
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
