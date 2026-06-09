import { useState, useEffect, useRef, useCallback, useLayoutEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import DestinationCard from "../components/DestinationCard";
import Dropdown from "../components/Dropdown";
import { CardSkeleton } from "../components/Skeleton";
import { fetchDestinations, fetchDestinationTypes, fetchReviewsByDestination } from "../api";
import SearchIcon from "../components/SearchIcon";

const PAGE_SIZE = 6;

const TYPE_META = {
  beach:     { icon: "🏖️", label: "Beach",     color: "#0EA5E9" },
  cultural:  { icon: "🏛️", label: "Cultural",  color: "#8B5CF6" },
  adventure: { icon: "⛰️", label: "Adventure", color: "#10B981" },
  luxury:    { icon: "💎", label: "Luxury",    color: "#F59E0B" },
};

const ease = [0.22, 1, 0.36, 1];

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.03 } },
};
const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    mql.addEventListener?.("change", handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener?.("change", handler);
  }, [query]);
  return matches;
};

const useLockBodyScroll = (locked) => {
  useEffect(() => {
    if (!locked) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = original; };
  }, [locked]);
};

export default function DestinationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch]         = useState(searchParams.get("search") || "");
  const [inputVal, setInputVal]     = useState(searchParams.get("search") || "");
  const [filters, setFilters]       = useState({ price: "all", type: "all", rating: "all", sort: "default" });
  const [data, setData]             = useState([]);
  const [types, setTypes]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [focused, setFocused]       = useState(false);
  const [reviewsByDest, setReviewsByDest] = useState({});

  const heroRef = useRef(null);
  const cardRef = useRef(null);
  const [cardOffset, setCardOffset] = useState(60);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet  = useMediaQuery("(min-width: 640px)");
  const reduceMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY  = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOp = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  useLockBodyScroll(showFilters && !isDesktop);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    const measure = () => setCardOffset(Math.round(el.offsetHeight / 2) + 16);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showFilters]);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) { setSearch(q); setInputVal(q); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchDestinationTypes().then(setTypes).catch(console.error); }, []);

  useEffect(() => {
    setLoading(true); setPage(1); setReviewsByDest({});
    const p = {};
    if (search)                        p.search = search;
    if (filters.price  !== "all")      p.price  = filters.price;
    if (filters.type   !== "all")      p.type   = filters.type;
    if (filters.rating !== "all")      p.rating = filters.rating;
    if (filters.sort   !== "default")  p.sort   = filters.sort;
    fetchDestinations(p)
      .then(async (r) => {
        const list = r.data || [];
        setData(list);
        if (list.length > 0) fetchAllReviews(list);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filters]);

  const fetchAllReviews = useCallback(async (destinations) => {
    const results = await Promise.all(
      destinations.map(async (d) => {
        try {
          const list = await fetchReviewsByDestination(d.id);
          return { id: d.id, list: Array.isArray(list) ? list : [] };
        } catch { return { id: d.id, list: [] }; }
      })
    );
    const next = {};
    results.forEach(({ id, list }) => { next[id] = list; });
    setReviewsByDest(next);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(inputVal);
    setSearchParams(inputVal.trim() ? { search: inputVal.trim() } : {});
  };

  const setFilter = (k, v) => setFilters((prev) => ({ ...prev, [k]: v }));

  const clearFilters = () => {
    setSearch(""); setInputVal("");
    setFilters({ price: "all", type: "all", rating: "all", sort: "default" });
    setSearchParams({});
  };

  const applyMobileFilters = () => setShowFilters(false);

  const hasFilters = search || filters.price !== "all" || filters.type !== "all" || filters.rating !== "all";
  const displayed  = data.slice(0, page * PAGE_SIZE);
  const hasMore    = displayed.length < data.length;
  const activeFilterCount = [filters.price, filters.type, filters.rating]
    .filter((v) => v !== "all").length + (search ? 1 : 0);

  const filterDropdownGrid = "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3";

  const renderFilterPanel = (inDrawer = false) => (
    <div className={inDrawer ? "px-4 sm:px-5 pb-5 pt-1" : "px-4 sm:px-5 pb-4 sm:pb-5 pt-4"}>
      <div className={filterDropdownGrid}>
        <Dropdown
          label="Price"
          value={filters.price}
          options={[
            { value: "all",  label: "All Prices" },
            { value: "low",  label: "Budget (< ₹1,500)",  icon: "💰" },
            { value: "mid",  label: "Mid (₹1.5k–₹2.2k)",  icon: "💵" },
            { value: "high", label: "Premium (₹2.2k+)",   icon: "💎" },
          ]}
          onChange={(v) => setFilter("price", v)}
        />
        <Dropdown
          label="Type"
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
            { value: "4.5", label: "4.5 & up",   icon: "⭐" },
            { value: "4.0", label: "4.0 & up",   icon: "⭐" },
            { value: "3.5", label: "3.5 & up",   icon: "⭐" },
          ]}
          onChange={(v) => setFilter("rating", v)}
        />
        <Dropdown
          label="Sort by"
          value={filters.sort}
          options={[
            { value: "default",      label: "Recommended",      icon: "✨" },
            { value: "price-asc",    label: "Price: Low → High", icon: "↑" },
            { value: "price-desc",   label: "Price: High → Low", icon: "↓" },
            { value: "rating-desc",  label: "Top Rated",        icon: "⭐" },
            { value: "rating-asc",   label: "Lowest Rated",     icon: "☆" },
            { value: "duration-asc", label: "Shortest First",   icon: "⏱️" },
            { value: "duration-desc",label: "Longest First",    icon: "⏳" },
            { value: "name-asc",     label: "Name A–Z",         icon: "🔤" },
            { value: "name-desc",    label: "Name Z–A",         icon: "🔤" },
          ]}
          onChange={(v) => setFilter("sort", v)}
        />
      </div>

      <div className={`mt-4 flex items-center gap-2 ${inDrawer ? "justify-between" : "justify-end"}`}>
        {hasFilters && (
          <motion.button
            onClick={clearFilters}
            whileTap={{ scale: 0.97 }}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all border border-rose-200 dark:border-rose-500/30 text-rose-500 bg-rose-50 dark:bg-rose-500/15 hover:bg-rose-100 dark:hover:bg-rose-500/25 active:bg-rose-100 flex items-center gap-1.5"
            style={{ minHeight: 40 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
            </svg>
            Clear all
          </motion.button>
        )}
        {inDrawer && (
          <motion.button
            onClick={applyMobileFilters}
            whileTap={{ scale: 0.97 }}
            className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl text-sm font-semibold text-white cursor-pointer shadow-md"
            style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)", minHeight: 40 }}
          >
            Show {data.length || 0} {data.length === 1 ? "result" : "results"}
          </motion.button>
        )}
      </div>
    </div>
  );

  return (
    <div
      className="pt-[64px] min-h-screen bg-gradient-to-b from-[#f0f4f8] to-[#e8edf3] dark:from-[#0d1527] dark:to-[#0b1220]"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <style>{`
        @media (prefers-color-scheme: dark) {
          body { background: #0b1220; }
        }
        .dark-bg { background: linear-gradient(180deg, #0b1220 0%, #0d1527 100%); }
        .pill-scroll { scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
        .pill-scroll::-webkit-scrollbar { display: none; }
        .pill-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .pill-scroll > * { scroll-snap-align: start; }
        @media (max-width: 480px) {
          .h1-tight { letter-spacing: -0.02em; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative overflow-visible"
        style={{ minHeight: "clamp(380px, 58vw, 640px)" }}
      >
        {/* Parallax bg (desktop only) */}
        <div className="absolute inset-0 overflow-hidden">
          {reduceMotion || !isDesktop ? (
            <div className="absolute inset-0">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=2000&q=85')",
                  backgroundSize: "cover",
                  backgroundPosition: "center 35%",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75" />
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 85% 55% at 50% 38%, transparent 35%, rgba(0,0,0,0.55) 100%)" }} />
            </div>
          ) : (
            <motion.div style={{ y: heroY }} className="absolute inset-0 scale-110">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=2000&q=85')",
                  backgroundSize: "cover",
                  backgroundPosition: "center 35%",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/75" />
              <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 85% 55% at 50% 38%, transparent 35%, rgba(0,0,0,0.55) 100%)" }} />
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-overlay hidden sm:block"
                style={{
                  backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
                  backgroundSize: "128px",
                }}
              />
            </motion.div>
          )}
        </div>

        {/* Hero text */}
        <motion.div
          style={{ opacity: heroOp }}
          className="relative z-10 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div style={{ paddingTop: "clamp(3.5rem, 9vw, 6.5rem)" }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3"
            >
              <span className="block w-6 sm:w-8 h-[2px] bg-white/70 rounded-full shrink-0" />
              <span className="text-white/70 text-[10px] sm:text-[11px] font-semibold tracking-[0.22em] sm:tracking-[0.28em] uppercase whitespace-nowrap">
                Discover Your Next Adventure
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.65, ease }}
              className="h1-tight font-bold text-white leading-[1.05] tracking-tight mb-3 max-w-2xl text-balance"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(1.95rem, 7.5vw, 4.75rem)",
              }}
            >
              Explore the{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className="relative z-10 bg-gradient-to-r from-amber-200 to-white bg-clip-text text-transparent">
                  World's
                </span>
                <svg
                  className="absolute -bottom-1 sm:-bottom-2 left-0 w-full"
                  height="7"
                  viewBox="0 0 200 7"
                  preserveAspectRatio="none"
                >
                  <path d="M0 4 Q 50 7 100 3.5 Q 150 0 200 4" stroke="#F59E0B" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </span>{" "}
              Hidden Gems
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.55, ease }}
              className="text-white/75 leading-relaxed max-w-md sm:max-w-lg"
              style={{ fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}
            >
              Handpicked escapes — from pristine beaches to cultural marvels — tailored to your wanderlust.
            </motion.p>
          </div>
        </motion.div>

        {/* ── Floating search + filter panel (inline on desktop, anchored card on mobile) ── */}
        <div
          className="absolute left-0 right-0 z-20 px-3 sm:px-4 lg:px-6"
          style={{ bottom: 0, transform: "translateY(50%)" }}
        >
          <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.6, ease }}
            className="max-w-[1200px] mx-auto"
          >
            <div
              className="rounded-2xl border border-white/40 dark:border-white/[0.08] shadow-2xl bg-white/96 dark:bg-[#1E2E4F]/96 backdrop-blur-xl"
              style={{
                boxShadow: "0 24px 60px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              {/* Search row */}
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5 p-3.5 sm:p-4 lg:p-5">
                <div className="flex-1 relative">
                  <motion.span
                    animate={{ scale: focused ? 1.08 : 1 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  >
                    <SearchIcon className="w-4 h-4" strokeWidth={2.2} />
                  </motion.span>
                  <input
                    type="text"
                    placeholder="City, country, or landmark…"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    aria-label="Search destinations"
                    className="w-full py-3 pl-10 pr-4 rounded-xl text-sm outline-none transition-all bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 border-2 border-transparent focus:border-sky-400 focus:ring-4 focus:ring-sky-400/15 focus:bg-white dark:focus:bg-white/8"
                    style={{ minHeight: 44 }}
                  />
                </div>

                <div className="flex gap-2 shrink-0">
                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 sm:flex-none py-3 px-5 sm:px-6 rounded-xl font-semibold text-sm text-white cursor-pointer shadow-md hover:shadow-lg active:shadow transition-all"
                    style={{
                      background: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)",
                      minHeight: 44,
                    }}
                  >
                    Search
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => setShowFilters((v) => !v)}
                    whileTap={{ scale: 0.97 }}
                    aria-expanded={showFilters}
                    className={`relative py-3 px-3.5 sm:px-4 rounded-xl text-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all border ${
                      showFilters || hasFilters
                        ? "border-sky-400 text-sky-500 bg-sky-50 dark:bg-sky-500/15 shadow-md"
                        : "border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 bg-white dark:bg-white/5 hover:border-sky-300 hover:text-sky-500"
                    }`}
                    style={{ minHeight: 44 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0">
                      <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74Z" clipRule="evenodd" />
                    </svg>
                    <span className="whitespace-nowrap">Filters</span>
                    <AnimatePresence>
                      {activeFilterCount > 0 && (
                        <motion.span
                          key="badge"
                          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                          className="w-[18px] h-[18px] min-w-[18px] min-h-[18px] bg-sky-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none"
                        >
                          {activeFilterCount}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              </form>

              {/* Collapsible filter panel — inline on desktop */}
              <AnimatePresence initial={false}>
                {showFilters && isDesktop && (
                  <motion.div
                    key="filters-inline"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="border-t border-slate-100 dark:border-white/10">
                      {renderFilterPanel(false)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Spacer — clears the bottom half of the floating search/filter card */}
      <div
        aria-hidden="true"
        className="transition-[height] duration-300 ease-out"
        style={{ height: `${cardOffset}px` }}
      />

      {/* ── Main content ── */}
      <div className="max-w-[1200px] mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">

        {/* ── Type pill strip ── */}
        {types.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5, ease }}
            className="mb-5 sm:mb-8 -mx-3.5 sm:mx-0"
          >
            <div
              className={`pill-scroll flex gap-2 sm:gap-2.5 overflow-x-auto px-3.5 sm:px-0 pb-1 ${
                isTablet ? "sm:flex-wrap sm:justify-center sm:overflow-visible" : ""
              }`}
            >
              {[{ v: "all", icon: "🌍", label: "All" }, ...types.map((t) => ({ v: t, ...TYPE_META[t] }))].map((t) => {
                const isActive = filters.type === t.v;
                return (
                  <motion.button
                    key={t.v}
                    onClick={() => setFilter("type", t.v)}
                    whileTap={{ scale: 0.95 }}
                    className={`shrink-0 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isActive
                        ? "text-white shadow-lg"
                        : "text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-sky-300 hover:text-sky-500 active:scale-95"
                    }`}
                    style={isActive ? {
                      background: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)",
                      boxShadow: "0 6px 18px rgba(14,165,233,0.32)",
                    } : {}}
                  >
                    <span className="text-sm sm:text-base">{t.icon}</span>
                    <span className="capitalize">{t.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Result count + clear bar ── */}
        <AnimatePresence mode="wait">
          {!loading && (
            <motion.div
              key={data.length}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-5 px-0.5"
            >
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {data.length === 0 ? (
                  "No destinations found"
                ) : (
                  <>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{displayed.length}</span>
                    <span className="text-slate-400 dark:text-slate-500"> of </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{data.length}</span>
                    <span> destination{data.length !== 1 ? "s" : ""}</span>
                  </>
                )}
              </p>
              {hasFilters && (
                <motion.button
                  onClick={clearFilters}
                  whileTap={{ scale: 0.97 }}
                  className="text-xs font-semibold text-sky-500 bg-sky-50 dark:bg-sky-500/15 px-3 py-1.5 rounded-full hover:bg-sky-100 dark:hover:bg-sky-500/25 active:bg-sky-100 transition-colors flex items-center gap-1 cursor-pointer border-none"
                  style={{ minHeight: 30 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                  Clear
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-8"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} variants={fadeUp}>
                <CardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        ) : data.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease }}
            className="text-center py-20 sm:py-32 flex flex-col items-center"
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 1.5, delay: 0.2, repeat: Infinity, repeatDelay: 3 }}
              className="text-6xl sm:text-7xl block mb-5"
            >
              🗺️
            </motion.span>
            <h3
              className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-white mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              No destinations found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base mb-7 max-w-sm sm:max-w-md px-4">
              We couldn't find any places matching your criteria. Try broadening your search or explore all destinations.
            </p>
            <motion.button
              onClick={clearFilters}
              whileTap={{ scale: 0.97 }}
              className="text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-full font-semibold cursor-pointer text-sm shadow-xl hover:shadow-2xl transition-all"
              style={{
                background: "linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)",
                minHeight: 48,
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
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-8"
            >
              {displayed.map((dest) => {
                const reviews = reviewsByDest[dest.id] || [];
                const latest  = reviews[0] || null;
                const avg     = reviews.length
                  ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length
                  : null;
                return (
                  <motion.div key={dest.id} variants={fadeUp}>
                    <DestinationCard
                      destination={dest}
                      latestReview={latest}
                      reviewCount={reviews.length || (Array.isArray(dest.reviews) ? dest.reviews.length : 0)}
                      avgRating={avg}
                    />
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Load more */}
            {hasMore && (
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18 }}
                className="text-center mt-10 sm:mt-16"
              >
                <div className="flex items-center justify-center gap-2.5 sm:gap-4 mb-4 sm:mb-5 px-2">
                  <div className="h-1 flex-1 max-w-[100px] sm:max-w-[200px] bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #0EA5E9, #3B82F6)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(displayed.length / data.length) * 100}%` }}
                      transition={{ duration: 0.55, ease }}
                    />
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 font-mono font-medium tabular-nums">
                    {displayed.length} / {data.length}
                  </span>
                  <div className="h-1 flex-1 max-w-[100px] sm:max-w-[200px] bg-slate-200 dark:bg-white/10 rounded-full" />
                </div>

                <motion.button
                  onClick={() => setPage((p) => p + 1)}
                  whileTap={{ scale: 0.97 }}
                  className="w-full sm:w-auto group bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-6 sm:px-10 py-3 sm:py-3.5 rounded-full font-semibold cursor-pointer text-sm hover:border-sky-400 hover:text-sky-500 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 mx-auto shadow-md hover:shadow-xl"
                  style={{ minHeight: 48 }}
                >
                  <span>Discover More</span>
                  <span className="text-slate-400 text-xs group-hover:text-sky-400 transition-colors tabular-nums">
                    {data.length - displayed.length} left
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-200 text-slate-400 group-hover:text-sky-400">
                    <path fillRule="evenodd" d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z" clipRule="evenodd" />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* ── Mobile / tablet filter drawer (bottom sheet) ── */}
      <AnimatePresence>
        {showFilters && !isDesktop && (
          <>
            <motion.div
              key="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowFilters(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              key="drawer-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 100 || info.velocity.y > 500) setShowFilters(false);
              }}
              className="fixed inset-x-0 bottom-0 z-50 lg:hidden bg-white dark:bg-[#1E2E4F] rounded-t-3xl shadow-2xl max-h-[88vh] flex flex-col"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-2.5 pb-1">
                <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-800 dark:text-white" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 bg-sky-500 text-white text-[10px] font-bold rounded-full align-middle">
                      {activeFilterCount}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  aria-label="Close filters"
                  className="w-9 h-9 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200 dark:active:bg-white/15 flex items-center justify-center cursor-pointer border-none bg-transparent text-slate-500 dark:text-slate-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {renderFilterPanel(true)}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}