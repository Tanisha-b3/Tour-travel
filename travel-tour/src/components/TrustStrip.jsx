import { useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

const items = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
    title: "Secure Payments",
    desc: "SSL-encrypted test checkout",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    title: "24/7 Support",
    desc: "Real humans on standby",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M12 17.27 18.18 21 16.54 13.97 22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27Z" />
      </svg>
    ),
    title: "Top Rated",
    desc: "4.9★ from 10,000+ travelers",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" />
        <path d="M3 12h18" />
        <path d="M12 3a14.5 14.5 0 0 1 0 18" />
        <path d="M12 3a14.5 14.5 0 0 0 0 18" />
      </svg>
    ),
    title: "50+ Destinations",
    desc: "Across 6 continents",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
        <path d="M3 6h18l-2 13H5L3 6Z" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
    ),
    title: "Best Price Match",
    desc: "Found it cheaper? We beat it",
  },
];

function Item({ item, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group flex items-center gap-3 px-5 py-3 rounded-2xl border border-slate-200/70 dark:border-white/8 bg-white/70 dark:bg-white/3 backdrop-blur-sm hover:border-[#31487A]/40 hover:bg-white dark:hover:bg-white/5 hover:shadow-[0_8px_24px_rgba(30,50,89,0.10)] dark:hover:shadow-[0_8px_24px_rgba(75,109,168,0.20)] transition-all"
    >
      <span className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-[#1E3259]/8 to-[#4B6DA8]/10 dark:from-[#31487A]/30 dark:to-[#4B6DA8]/20 flex items-center justify-center text-[#1E3259] dark:text-[#7A99CC] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
        {item.icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{item.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5 truncate">{item.desc}</p>
      </div>
    </motion.div>
  );
}

export default function TrustStrip() {
  return (
    <section
      aria-label="Why travelers trust us"
      className="relative py-10 px-5 sm:py-12 sm:px-6 border-y border-slate-200/60 dark:border-white/5 bg-gradient-to-r from-[#EBF0FA] via-white to-[#EBF0FA] dark:from-[#0B1221] dark:via-[#111C30] dark:to-[#0B1221]"
    >
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {items.map((item, i) => (
            <Item key={item.title} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
