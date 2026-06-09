import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createUserTestimonial } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

const ease = [0.22, 1, 0.36, 1];

function StarPicker({ value, onChange, darkMode }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-1.5" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => {
        const active = (hover || value) >= i;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            className="p-1 rounded transition-transform hover:scale-110"
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
          >
            <svg viewBox="0 0 24 24" className={`w-7 h-7 ${active ? "text-amber-400" : darkMode ? "text-white/15" : "text-slate-300"}`} fill="currentColor">
              <path d="M12 2.5l2.95 6.36 6.55.62-4.95 4.55 1.45 6.47L12 17.27l-6 3.23 1.45-6.47L2.5 9.48l6.55-.62L12 2.5z" />
            </svg>
          </button>
        );
      })}
      <span className={`ml-2 text-xs font-semibold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        {value ? ["", "Poor", "Fair", "Good", "Great", "Amazing"][value] : "Tap a star"}
      </span>
    </div>
  );
}

export default function ReviewModal({ booking, onClose, onSuccess }) {
  const { token } = useAuth();
  const { darkMode } = useTheme();
  const addToast = useToast();
  const [rating, setRating] = useState(5);
  const [location, setLocation] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!booking) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [booking, onClose]);

  if (!booking) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmed = text.trim();
    if (trimmed.length < 10) {
      setError("Please share at least 10 characters about your trip");
      return;
    }

    setSubmitting(true);
    try {
      await createUserTestimonial(
        { bookingId: booking._id, text: trimmed, rating, location: location.trim() },
        token
      );
      addToast("success", "Thanks for your review!");
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="review-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:px-4"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 24 }}
          transition={{ duration: 0.28, ease }}
          onClick={(e) => e.stopPropagation()}
          className={`relative w-full sm:max-w-[460px] max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border ${
            darkMode ? "bg-[#203354] border-white/10" : "bg-white border-slate-200/70"
          }`}
        >
          <div className="h-1 bg-gradient-to-r from-[#31487A] via-[#31487A] to-[#818cf8] shrink-0" />

          <div className="sm:hidden flex justify-center pt-3 select-none">
            <div className={`w-10 h-1 rounded-full ${darkMode ? "bg-white/20" : "bg-slate-200"}`} />
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              darkMode ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            }`}
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>

          <form onSubmit={submit} className="px-7 pt-5 pb-7 overflow-y-auto flex-1 min-h-0 overscroll-contain">
            <div className="text-center mb-5">
              <div className={`w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl shadow-lg ${
                darkMode ? "bg-gradient-to-br from-[#31487A]/20 to-[#31487A]/10 border border-white/10" : "bg-gradient-to-br from-[#31487A]/10 to-[#31487A]/10 border border-[#31487A]/20"
              }`}>
                ✨
              </div>
              <h2
                className={`text-[24px] font-bold leading-tight ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Share Your Experience
              </h2>
              <p className={`text-sm mt-1.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                How was your trip to <span className="font-semibold">{booking.tourName}</span>?
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-2 tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Your Rating
                </label>
                <StarPicker value={rating} onChange={setRating} darkMode={darkMode} />
              </div>

              <div>
                <label htmlFor="loc" className={`block text-xs font-semibold mb-1.5 tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Where are you from? <span className="font-normal opacity-60">(optional)</span>
                </label>
                <input
                  id="loc"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Mumbai, India"
                  maxLength={60}
                  className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 border ${
                    darkMode
                      ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#31487A]/50 focus:bg-white/10"
                      : "bg-slate-50 border-slate-200 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#31487A]/50 focus:bg-white"
                  }`}
                />
              </div>

              <div>
                <label htmlFor="rev" className={`block text-xs font-semibold mb-1.5 tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Your Review
                </label>
                <textarea
                  id="rev"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tell others what you loved about this trip..."
                  rows={4}
                  maxLength={1000}
                  className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 border resize-none ${
                    darkMode
                      ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#31487A]/50 focus:bg-white/10"
                      : "bg-slate-50 border-slate-200 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#31487A]/50 focus:bg-white"
                  }`}
                />
                <p className={`text-[10px] mt-1 text-right ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                  {text.length}/1000
                </p>
              </div>

              {error && (
                <div className={`flex items-start gap-2 text-sm px-4 py-3 rounded-xl ${
                  darkMode ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-200"
                }`}>
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={!submitting ? { scale: 1.015, y: -1 } : {}}
                whileTap={!submitting ? { scale: 0.98 } : {}}
                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm cursor-pointer border-none disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, #31487A 0%, #31487A 100%)",
                  boxShadow: "0 6px 24px rgba(49,72,122,0.3)",
                }}
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 pointer-events-none" />
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                      className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Submitting…
                  </span>
                ) : (
                  "Submit Review →"
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
