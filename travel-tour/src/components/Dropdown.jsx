import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

export default function Dropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selected = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={ref} className="relative">
      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] block mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-2 py-2.5 px-3.5 rounded-xl text-sm outline-none transition-all duration-200 cursor-pointer border-2 ${
          open
            ? "border-[#31487A] bg-white dark:bg-white/10 text-slate-700 dark:text-slate-200"
            : "border-transparent bg-[#f2f0eb] dark:bg-white/6 text-slate-700 dark:text-slate-300 hover:border-[#31487A]/40"
        }`}
      >
        <span className="truncate flex items-center gap-1.5">
          {selected.icon && <span className="shrink-0">{selected.icon}</span>}
          <span>{selected.label}</span>
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease }}
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          className="w-4 h-4 shrink-0 text-slate-400 dark:text-slate-500"
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </motion.svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease }}
            className="absolute z-[9999] left-0 right-0 mt-1.5 rounded-xl bg-white dark:bg-[#1E2E4F] shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors cursor-pointer border-none ${
                    isSelected
                      ? "bg-[#31487A]/10 text-[#31487A] font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-[#f2f0eb] dark:hover:bg-white/5"
                  } ${i > 0 ? "border-t border-slate-100 dark:border-white/5" : ""}`}
                >
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span>{opt.label}</span>
                  {isSelected && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                      className="w-4 h-4 ml-auto shrink-0 text-[#31487A]"
                    >
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </motion.svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
