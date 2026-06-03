import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import DestinationCard from "../components/DestinationCard";
import Dropdown from "../components/Dropdown";
import { CardSkeleton } from "../components/Skeleton";
import { fetchDestinations, fetchDestinationTypes } from "../api";

const PAGE_SIZE = 6;

const TYPE_META = {
  beach:     { icon: "🏖️", label: "Beach",     color: "#38bdf8" },
  cultural:  { icon: "🏛️", label: "Cultural",  color: "#a78bfa" },
  adventure: { icon: "⛰️", label: "Adventure", color: "#34d399" },
  luxury:    { icon: "💎", label: "Luxury",    color: "#0ea5e9" },
};

const ease = [0.22, 1, 0.36, 1];

/* stagger container */
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

export default function DestinationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch]       = useState(searchParams.get("search") || "");
  const [inputVal, setInputVal]   = useState(searchParams.get("search") || "");
  const [filters, setFilters]     = useState({ price: "all", type: "all", rating: "all" });
  const [data, setData]           = useState([]);
  const [types, setTypes]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [focused, setFocused]     = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY   = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOp  = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) { setSearch(q); setInputVal(q); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchDestinationTypes().then(setTypes).catch(console.error); }, []);

  useEffect(() => {
    setLoading(true); setPage(1);
    const p = {};
    if (search) p.search = search;
    if (filters.price  !== "all") p.price  = filters.price;
    if (filters.type   !== "all") p.type   = filters.type;
    if (filters.rating !== "all") p.rating = filters.rating;
    fetchDestinations(p)
      .then((r) => setData(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputVal);
    setSearchParams(inputVal.trim() ? { search: inputVal.trim() } : {});
  };

  const setFilter = (k, v) => setFilters((prev) => ({ ...prev, [k]: v }));

  const clearFilters = () => {
    setSearch(""); setInputVal("");
    setFilters({ price: "all", type: "all", rating: "all" });
    setSearchParams({});
  };

  const hasFilters = search || filters.price !== "all" || filters.type !== "all" || filters.rating !== "all";
  const displayed  = data.slice(0, page * PAGE_SIZE);
  const hasMore    = displayed.length < data.length;

  const activeFilterCount = [filters.price, filters.type, filters.rating].filter((v) => v !== "all").length + (search ? 1 : 0);

  return (
    <div
      className="pt-[64px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Parallax Hero ── */}
      <section ref={heroRef} className="relative h-[300px] md:h-[400px] overflow-hidden flex items-end">
        <motion.div style={{ y: heroY }} className="absolute inset-0 scale-110">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1800&q=85')",
              backgroundSize: "cover",
              backgroundPosition: "center 45%",
            }}
          />
          {/* layered overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#06111f]/55 via-[#06111f]/20 to-[#06111f]/80" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 75% 60% at 50% 50%, transparent 30%, #06111f 100%)" }} />
          {/* grain */}
          <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat", backgroundSize: "128px",
          }} />
        </motion.div>

        <motion.div
          style={{ opacity: heroOp }}
          className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pb-10"
        >
          {/* eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="flex items-center gap-2 mb-3"
          >
            <span className="block w-6 h-px bg-gradient-to-r from-transparent to-[#0ea5e9]" />
            <span className="text-[#0ea5e9] text-[10px] font-bold tracking-[0.22em] uppercase">
              Curated Collection
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.65, ease }}
            className="text-[clamp(2.4rem,6vw,4.2rem)] font-bold text-white leading-[0.95] tracking-tight mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Explore{" "}
            <span className="bg-clip-text text-transparent" style={{
              backgroundImage: "linear-gradient(110deg, #0ea5e9 0%, #3b82f6 50%, #3b82f6 100%)"
            }}>
              Destinations
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55, ease }}
            className="text-white/65 text-base max-w-[420px]"
          >
            Handpicked getaways across 50+ countries — filtered just for you.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Main content ── */}
      <div className="max-w-[1200px] mx-auto px-5 py-10">

        {/* ── Search + Filter panel ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease }}
          className="mb-8 rounded-3xl relative z-10"
          style={{
            background: "rgba(255,255,255,0.72)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(0,0,0,0.07)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.07), 0 1px 0 rgba(255,255,255,0.8) inset",
          }}
        >
          {/* dark mode variant applied via Tailwind */}
          <div className="dark:bg-[#0d1f35]/80 dark:border-white/8 p-5 md:p-6 rounded-3xl">

            {/* Search row */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-0">
              {/* Input */}
              <div className="flex-1 relative">
                <motion.span
                  animate={{ scale: focused ? 1.1 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-base pointer-events-none"
                >
                  🔍
                </motion.span>
                <input
                  type="text"
                  placeholder="Search destinations, countries…"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  aria-label="Search destinations"
                  className="w-full py-3.5 pl-11 pr-4 rounded-2xl text-sm outline-none transition-all duration-200 bg-[#f2f0eb] dark:bg-white/6 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-2 border-transparent focus:border-[#0ea5e9] focus:bg-white dark:focus:bg-white/10"
                />
              </div>

              {/* Search btn */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                className="py-3.5 px-7 rounded-2xl font-semibold text-sm text-white cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #3b82f6 100%)",
                  boxShadow: "0 4px 20px rgba(14,165,233,0.3)",
                }}
              >
                Search
              </motion.button>

              {/* Filter toggle */}
              <motion.button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                aria-expanded={showFilters}
                className={`relative py-3.5 px-5 rounded-2xl text-sm font-semibold cursor-pointer flex items-center gap-2 transition-all border-2 ${
                  showFilters || hasFilters
                    ? "border-[#0ea5e9] text-[#1d4ed8] bg-[#0ea5e9]/10 dark:text-[#0ea5e9] dark:bg-[#0ea5e9]/8"
                    : "border-[#e8e4dc] dark:border-white/10 text-slate-500 dark:text-slate-400 bg-transparent hover:border-[#0ea5e9] hover:text-[#1d4ed8]"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">Filters</span>
                <AnimatePresence>
                  {activeFilterCount > 0 && (
                    <motion.span
                      key="count"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="w-5 h-5 bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6] text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                    >
                      {activeFilterCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </form>

            {/* Expandable filter panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease }}
                  className="overflow-visible"
                >
                  <div className="border-t border-slate-100 dark:border-white/8 mt-4 pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <Dropdown
                      label="Price Range"
                      value={filters.price}
                      options={[
                        { value: "all",  label: "All Prices" },
                        { value: "low",  label: "Budget — under $1,500",   icon: "💰" },
                        { value: "mid",  label: "Mid — $1,500 – $2,200",  icon: "💵" },
                        { value: "high", label: "Premium — $2,200+",      icon: "💎" },
                      ]}
                      onChange={(v) => setFilter("price", v)}
                    />
                    <Dropdown
                      label="Tour Type"
                      value={filters.type}
                      options={[
                        { value: "all", label: "All Types", icon: "🌍" },
                        ...types.map((t) => ({
                          value: t,
                          label: t.charAt(0).toUpperCase() + t.slice(1),
                          icon: TYPE_META[t]?.icon || "📍",
                        })),
                      ]}
                      onChange={(v) => setFilter("type", v)}
                    />
                    <Dropdown
                      label="Min. Rating"
                      value={filters.rating}
                      options={[
                        { value: "all", label: "Any Rating" },
                        { value: "4.5", label: "4.5 and above", icon: "⭐" },
                        { value: "4.0", label: "4.0 and above", icon: "⭐" },
                        { value: "3.5", label: "3.5 and above", icon: "⭐" },
                      ]}
                      onChange={(v) => setFilter("rating", v)}
                    />

                    {/* Clear */}
                    <motion.button
                      onClick={clearFilters}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className="py-2.5 px-5 rounded-xl text-sm font-semibold cursor-pointer transition-all border-2 border-rose-200 dark:border-rose-900/60 text-rose-400 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-400 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                      Clear All
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Type pill filters ── */}
        {types.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease }}
            className="flex gap-2 mb-8 flex-wrap"
          >
            {[{ v: "all", icon: "🌍", label: "All" }, ...types.map((t) => ({ v: t, ...TYPE_META[t] }))].map((t) => {
              const isActive = filters.type === t.v;
              return (
                <motion.button
                  key={t.v}
                  onClick={() => setFilter("type", t.v)}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative px-5 py-2 rounded-full text-sm font-semibold cursor-pointer transition-all flex items-center gap-1.5 overflow-hidden ${
                    isActive
                      ? "text-white shadow-lg"
                      : "text-slate-600 dark:text-slate-400 border-2 border-[#e2ddd5] dark:border-white/10 bg-white dark:bg-transparent hover:border-[#0ea5e9] hover:text-[#1d4ed8] dark:hover:text-[#0ea5e9]"
                  }`}
                  style={isActive ? {
                    background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 55%, #3b82f6 100%)",
                    boxShadow: "0 4px 18px rgba(14,165,233,0.35)",
                    border: "2px solid transparent",
                  } : {}}
                >
                  <span>{t.icon}</span>
                  <span className="capitalize">{t.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* ── Result count ── */}
        <AnimatePresence mode="wait">
          {!loading && (
            <motion.div
              key={data.length}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between mb-6"
            >
              <p className="text-sm text-slate-400 dark:text-slate-500">
                {data.length === 0
                  ? "No destinations found"
                  : (
                    <>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{displayed.length}</span>
                      <span> of </span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{data.length}</span>
                      <span> destination{data.length !== 1 ? "s" : ""}</span>
                    </>
                  )
                }
              </p>
              {hasFilters && (
                <motion.button
                  onClick={clearFilters}
                  whileHover={{ scale: 1.03 }}
                  className="text-[11px] font-semibold text-[#1d4ed8] dark:text-[#0ea5e9] bg-[#0ea5e9]/10 dark:bg-[#0ea5e9]/8 px-3 py-1.5 rounded-full hover:bg-[#0ea5e9]/15 transition-colors flex items-center gap-1.5 cursor-pointer border-none"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                  Clear filters
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid / Empty / Skeleton ── */}
        {loading ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} variants={fadeUp}>
                <CardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        ) : data.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease }}
            className="text-center py-24 flex flex-col items-center"
          >
            <motion.span
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="text-6xl block mb-6"
            >
              🗺️
            </motion.span>
            <h3
              className="text-2xl font-bold text-slate-800 dark:text-white mb-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              No destinations found
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-8 max-w-[280px]">
              Try adjusting your search or filter criteria to discover more places.
            </p>
            <motion.button
              onClick={clearFilters}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="text-white px-9 py-3.5 rounded-full font-semibold cursor-pointer text-sm border-none"
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #3b82f6 100%)",
                boxShadow: "0 6px 24px rgba(14,165,233,0.35)",
              }}
            >
              Clear All Filters
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {displayed.map((dest) => (
                <motion.div key={dest.id} variants={fadeUp}>
                  <DestinationCard destination={dest} />
                </motion.div>
              ))}
            </motion.div>

            {/* Load more */}
            {hasMore && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center mt-14"
              >
                {/* Progress indicator */}
                <div className="flex items-center justify-center gap-3 mb-5">
                  <div className="h-px flex-1 max-w-[120px] bg-[#e2ddd5] dark:bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #0ea5e9, #3b82f6)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(displayed.length / data.length) * 100}%` }}
                      transition={{ duration: 0.6, ease }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    {displayed.length} / {data.length}
                  </span>
                  <div className="h-px flex-1 max-w-[120px] bg-[#e2ddd5] dark:bg-white/8 rounded-full" />
                </div>

                <motion.button
                  onClick={() => setPage((p) => p + 1)}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-transparent border-2 border-[#e2ddd5] dark:border-white/12 text-slate-600 dark:text-slate-300 px-10 py-3.5 rounded-full font-semibold cursor-pointer text-sm hover:border-[#0ea5e9] hover:text-[#1d4ed8] dark:hover:text-[#0ea5e9] dark:hover:border-[#0ea5e9] transition-all flex items-center gap-2.5 mx-auto"
                >
                  <span>Load More</span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs">
                    {data.length - displayed.length} remaining
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-50">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}