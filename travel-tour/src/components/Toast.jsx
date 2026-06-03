import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const CONFIG = {
  success: { icon: "✓", gradient: "from-emerald-500 to-teal-500", bar: "bg-emerald-500", ring: "ring-emerald-500/20" },
  error:   { icon: "✕", gradient: "from-red-500 to-rose-500",    bar: "bg-red-500",    ring: "ring-red-500/20" },
  info:    { icon: "ℹ", gradient: "from-[#38bdf8] to-[#60a5fa]", bar: "bg-[#38bdf8]", ring: "ring-[#38bdf8]/20" },
};

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const cfg = CONFIG[toast.type] || CONFIG.info;

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), 3100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (exiting) {
      const t = setTimeout(() => onRemove(toast.id), 400);
      return () => clearTimeout(t);
    }
  }, [exiting, toast.id, onRemove]);

  return (
    <div
      className={`flex items-start gap-3 pl-0 pr-4 py-3 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0c1a2e] pointer-events-auto transition-all duration-400 overflow-hidden ${
        exiting ? "opacity-0 translate-x-full scale-95" : "opacity-100 translate-x-0 scale-100"
      }`}
    >
      <div className={`w-1.5 self-stretch shrink-0 ${cfg.bar}`} />
      <span className={`w-7 h-7 rounded-full bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5`}>
        {cfg.icon}
      </span>
      <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 leading-relaxed py-0.5">{toast.message}</span>
      <button
        onClick={() => setExiting(true)}
        className="self-start mt-1 opacity-40 hover:opacity-100 cursor-pointer text-lg leading-none bg-transparent border-none text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity"
      >
        ×
      </button>
    </div>
  );
}

export default function Toast({ toasts, onRemove }) {
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none w-[360px] max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>,
    document.body
  );
}
