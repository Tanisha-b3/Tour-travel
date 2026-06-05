import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}) {
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const confirmStyles = variant === "danger"
    ? "bg-gradient-to-r from-rose-500 to-red-500 hover:shadow-rose-500/30"
    : "bg-gradient-to-r from-[#31487A] to-[#31487A] hover:shadow-[#31487A]/30";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 18 }}
            transition={{ duration: 0.22, ease }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[420px] bg-white dark:bg-[#1E2E4F] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-500" />
            <div className="p-6">
              <div className="flex items-start gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                  variant === "danger"
                    ? "bg-rose-500/10 text-rose-500"
                    : "bg-[#31487A]/10 text-[#31487A]"
                }`}>
                  ⚠️
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 pl-[52px]">{message}</p>
            </div>
            <div className="flex gap-2 px-6 pb-5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md transition-shadow disabled:opacity-60 ${confirmStyles}`}
              >
                {loading ? "Working…" : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
