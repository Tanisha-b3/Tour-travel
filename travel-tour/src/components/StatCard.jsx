import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

const TONE_STYLES = {
  sky:     { ring: "from-[#31487A] to-[#31487A]", text: "text-[#31487A]", bg: "bg-[#31487A]/10" },
  emerald: { ring: "from-emerald-400 to-teal-500", text: "text-emerald-500", bg: "bg-emerald-500/10" },
  amber:   { ring: "from-amber-400 to-orange-500", text: "text-amber-500", bg: "bg-amber-500/10" },
  violet:  { ring: "from-violet-400 to-fuchsia-500", text: "text-violet-500", bg: "bg-violet-500/10" },
  rose:    { ring: "from-rose-400 to-red-500", text: "text-rose-500", bg: "bg-rose-500/10" },
};

export default function StatCard({ icon, label, value, trend, tone = "sky", delay = 0 }) {
  const toneStyle = TONE_STYLES[tone] || TONE_STYLES.sky;
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease }}
      whileHover={{ y: -4 }}
      className="relative rounded-2xl bg-white dark:bg-[#1E2E4F] border border-slate-200/70 dark:border-white/5 p-5 shadow-[0_4px_20px_rgba(49,72,122,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden group"
    >
      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${toneStyle.ring} opacity-10 group-hover:opacity-20 transition-opacity blur-xl`} />
      <div className="relative flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl ${toneStyle.bg} flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        {trend != null && (
          <span className={`text-[11px] font-semibold ${trend >= 0 ? "text-emerald-500" : "text-rose-500"} flex items-center gap-0.5`}>
            <span>{trend >= 0 ? "▲" : "▼"}</span>
            <span>{Math.abs(trend)}%</span>
          </span>
        )}
      </div>
      <div className="relative">
        <p className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          {value}
        </p>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide">
          {label}
        </p>
      </div>
    </motion.div>
  );
}
