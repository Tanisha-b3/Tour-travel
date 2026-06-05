import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import DestinationCard from "../components/DestinationCard";
import Dropdown from "../components/Dropdown";
import { CardSkeleton } from "../components/Skeleton";
import { fetchDestinations, fetchDestinationTypes } from "../api";

const PAGE_SIZE = 6;

const TYPE_META = {
  beach:     { icon: "🏖️", label: "Beach",     color: "#0EA5E9" },
  cultural:  { icon: "🏛️", label: "Cultural",  color: "#8B5CF6" },
  adventure: { icon: "⛰️", label: "Adventure", color: "#10B981" },
  luxury:    { icon: "💎", label: "Luxury",    color: "#F59E0B" },
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
  const [showFilters, setShowFilters] = useState(true); // Changed to true by default
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
      className="pt-[64px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c]"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* ── Parallax Hero with Search Overlay ── */}
      <section ref={heroRef} className="relative min-h-[560px] md:min-h-[640px] overflow-visible">
        {/* Background Image */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div style={{ y: heroY }} className="absolute inset-0 scale-110">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=2000&q=85')",
                backgroundSize: "cover",
                backgroundPosition: "center 35%",
              }}
            />
            {/* enhanced overlays for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 40%, transparent 40%, rgba(0,0,0,0.5) 100%)" }} />
            {/* animated grain overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundRepeat: "repeat", backgroundSize: "128px",
            }} />
          </motion.div>
        </div>

        {/* Hero Content */}
        <motion.div
          style={{ opacity: heroOp }}
          className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pt-20 md:pt-28"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="flex items-center gap-3 mb-4"
          >
            <span className="block w-8 h-[2px] bg-white/80 rounded-full" />
            <span className="text-white/80 text-[11px] font-semibold tracking-[0.3em] uppercase">
              DISCOVER YOUR NEXT
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="text-[clamp(2.8rem,8vw,5rem)] font-bold text-white leading-[1.05] tracking-tight mb-4 max-w-3xl"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Explore the{" "}
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-amber-200 to-white bg-clip-text text-transparent">
                World's
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" preserveAspectRatio="none">
                <path d="M0 4 Q 50 8 100 4 Q 150 0 200 4" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
            </span>{" "}
            Hidden Gems
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease }}
            className="text-white/80 text-base md:text-lg max-w-[540px] drop-shadow-sm"
          >
            From pristine beaches to cultural marvels — handpicked escapes tailored to your wanderlust.
          </motion.p>
        </motion.div>

        {/* ── Search + Filter panel - Always visible with filters showing ── */}
        <div className="absolute bottom-0 left-0 right-0 z-20 transform translate-y-1/2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.6, ease }}
            className="max-w-[1200px] mx-auto px-5"
          >
            <div className="bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-white/10 shadow-2xl p-5 md:p-6">
              {/* Search row */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                {/* Input with glow effect */}
                <div className="flex-1 relative group">
                  <motion.span
                    animate={{ scale: focused ? 1.05 : 1 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none"
                  >
                    🔍
                  </motion.span>
                  <input
                    type="text"
                    placeholder="Search by city, country, or landmark..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    aria-label="Search destinations"
                    className="w-full py-3.5 pl-11 pr-4 rounded-xl text-sm outline-none transition-all duration-200 bg-gray-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 border-2 border-transparent focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/20 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                {/* Search btn */}
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="py-3.5 px-8 rounded-xl font-semibold text-sm text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)",
                  }}
                >
                  Search
                </motion.button>

                {/* Filter toggle - Now just shows/hides additional filters, but filters are always visible */}
                <motion.button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  aria-expanded={showFilters}
                  className={`relative py-3.5 px-5 rounded-xl text-sm font-semibold cursor-pointer flex items-center gap-2 transition-all border ${
                    showFilters || hasFilters
                      ? "border-[#0EA5E9] text-[#0EA5E9] bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/20 shadow-md"
                      : "border-gray-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 hover:border-[#0EA5E9] hover:text-[#0EA5E9]"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
                  </svg>
                  <span className="hidden sm:inline">{showFilters ? "Hide Filters" : "Show Filters"}</span>
                  <AnimatePresence>
                    {activeFilterCount > 0 && (
                      <motion.span
                        key="count"
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                        className="w-5 h-5 bg-gradient-to-br from-[#0EA5E9] to-[#3B82F6] text-white text-[10px] rounded-full flex items-center justify-center font-bold"
                      >
                        {activeFilterCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </form>

              {/* Filter panel - Always visible when showFilters is true */}
              {showFilters && (
                <div className="border-t border-gray-100 dark:border-white/10 mt-5 pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <Dropdown
                      label="Price Range"
                      value={filters.price}
                      options={[
                        { value: "all",  label: "All Prices" },
                        { value: "low",  label: "Budget — under ₹1,500",   icon: "💰" },
                        { value: "mid",  label: "Mid — ₹1,500 – ₹2,200",  icon: "💵" },
                        { value: "high", label: "Premium — ₹2,200+",      icon: "💎" },
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
                      className="py-2.5 px-5 rounded-xl text-sm font-semibold cursor-pointer transition-all border border-rose-200 dark:border-rose-800/40 text-rose-500 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 hover:border-rose-300 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                      </svg>
                      Clear All
                    </motion.button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Spacer for the overlay ── */}
      <div className="h-32 md:h-36" />

      {/* ── Main content ── */}
      <div className="max-w-[1200px] mx-auto px-5 py-8">

        {/* ── Type pill filters ── */}
        {types.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease }}
            className="flex gap-3 mb-10 flex-wrap justify-center"
          >
            {[{ v: "all", icon: "🌍", label: "All" }, ...types.map((t) => ({ v: t, ...TYPE_META[t] }))].map((t) => {
              const isActive = filters.type === t.v;
              return (
                <motion.button
                  key={t.v}
                  onClick={() => setFilter("type", t.v)}
                  whileHover={{ scale: 1.05, y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all flex items-center gap-2 overflow-hidden ${
                    isActive
                      ? "text-white shadow-lg"
                      : "text-slate-600 dark:text-slate-300 border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/50 hover:border-[#0EA5E9] hover:text-[#0EA5E9] hover:bg-white dark:hover:bg-slate-800"
                  }`}
                  style={isActive ? {
                    background: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)",
                    boxShadow: "0 8px 20px rgba(14,165,233,0.3)",
                  } : {}}
                >
                  <span className="text-base">{t.icon}</span>
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
              className="flex items-center justify-between mb-6 px-1"
            >
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {data.length === 0
                  ? "No destinations found"
                  : (
                    <>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{displayed.length}</span>
                      <span> of </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-200">{data.length}</span>
                      <span> destination{data.length !== 1 ? "s" : ""}</span>
                    </>
                  )
                }
              </p>
              {hasFilters && (
                <motion.button
                  onClick={clearFilters}
                  whileHover={{ scale: 1.02 }}
                  className="text-xs font-semibold text-[#0EA5E9] dark:text-[#0EA5E9] bg-[#0EA5E9]/10 dark:bg-[#0EA5E9]/15 px-3 py-1.5 rounded-full hover:bg-[#0EA5E9]/20 transition-colors flex items-center gap-1 cursor-pointer border-none"
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
            className="text-center py-32 flex flex-col items-center"
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 1.5, delay: 0.2, repeat: Infinity, repeatDelay: 3 }}
              className="text-7xl block mb-6"
            >
              🗺️
            </motion.span>
            <h3
              className="text-3xl font-bold text-slate-800 dark:text-white mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              No destinations found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-base mb-10 max-w-md">
              We couldn't find any places matching your criteria. Try broadening your search or explore all destinations.
            </p>
            <motion.button
              onClick={clearFilters}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.97 }}
              className="text-white px-10 py-4 rounded-full font-semibold cursor-pointer text-sm shadow-xl hover:shadow-2xl transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)",
              }}
            >
              Explore All Destinations
            </motion.button>
          </motion.div>
        ) : (
          <>
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
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
                className="text-center mt-16"
              >
                {/* Enhanced progress indicator */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="h-1 flex-1 max-w-[200px] bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(displayed.length / data.length) * 100}%` }}
                      transition={{ duration: 0.6, ease }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                    {displayed.length} / {data.length}
                  </span>
                  <div className="h-1 flex-1 max-w-[200px] bg-gray-200 dark:bg-slate-700 rounded-full" />
                </div>

                <motion.button
                  onClick={() => setPage((p) => p + 1)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-10 py-3.5 rounded-full font-semibold cursor-pointer text-sm hover:border-[#0EA5E9] hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] transition-all duration-200 flex items-center gap-3 mx-auto shadow-md hover:shadow-xl"
                >
                  <span>Discover More</span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs group-hover:text-[#0EA5E9]">
                    {data.length - displayed.length} remaining
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-200">
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