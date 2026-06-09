import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { fetchDestinations } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const ease = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.48, ease } },
};

const CATEGORIES = [
  { value: "all",       label: "All",       icon: "🌍" },
  { value: "adventure", label: "Adventure", icon: "⛰️" },
  { value: "beach",     label: "Beach",     icon: "🏖️" },
  { value: "cultural",  label: "Cultural",  icon: "🏛️" },
  { value: "luxury",    label: "Luxury",    icon: "💎" },
];

const safeRender = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return value.name || value.text || "";
  return String(value);
};

/* ── Tour Card ── */
function TourCard({ tour, index }) {
  const catMeta = CATEGORIES.find((c) => c.value === tour.type) || CATEGORIES[0];
  const [imgLoaded, setImgLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user, openAuthModal } = useAuth();
  const addToast = useToast();

  const handleBookClick = (e) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("login");
      addToast("info", "Please login to book tours");
    }
  };

  const ratingValue =
    typeof tour.rating === "object"
      ? tour.rating?.value || tour.rating?.rating || 4.5
      : tour.rating || 4.5;
  const reviewCount =
    typeof tour.reviews === "object"
      ? tour.reviews?.count || tour.reviews?.total || 89
      : tour.reviews || 89;

  return (
    <motion.article
      variants={fadeUp}
      layout
      exit={{ opacity: 0, scale: 0.93, y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#1a2744] border border-slate-100 dark:border-white/[0.07] transition-shadow duration-300 hover:shadow-2xl"
      style={{ boxShadow: "0 4px 24px -4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)" }}
    >
      {/* Image Container - Fixed Aspect Ratio */}
      <div className="relative w-full pt-[66%] overflow-hidden bg-slate-100 dark:bg-white/5">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-white/5 dark:via-white/8 dark:to-white/5 animate-pulse" />
        )}
        <motion.img
          src={tour.image}
          alt={safeRender(tour.name)}
          onLoad={() => setImgLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: imgLoaded ? 1 : 0 }}
          animate={{ scale: isHovered ? 1.07 : 1 }}
          transition={{ duration: 0.55, ease }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {/* Category badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md bg-black/30 border border-white/20 text-white z-10">
          <span className="text-xs">{catMeta.icon}</span>
          <span className="capitalize hidden xs:inline">{safeRender(tour.type) || "Tour"}</span>
        </div>

        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full z-10">
          <span className="text-yellow-400 text-[10px]">★</span>
          <span className="text-white text-[11px] font-bold">{ratingValue}</span>
          <span className="text-white/50 text-[9px] hidden xs:inline">({reviewCount})</span>
        </div>

        {/* Price + duration overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between z-10">
          <div>
            <div className="text-white/50 text-[9px] line-through hidden xs:block">
              ₹{((tour.price || 0) * 1.2).toFixed(0)}
            </div>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span
                className="text-white font-bold leading-none"
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "clamp(1.25rem, 4vw, 1.75rem)",
                }}
              >
                ₹{tour.price || 0}
              </span>
              <span className="text-white/55 text-[9px]">/ person</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
            <span className="text-white/70 text-[9px]">⏱</span>
            <span className="text-white/90 text-[10px] font-medium">{safeRender(tour.duration)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Location */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-[#31487A] shrink-0">
            <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 8c0 2.255 1.19 4.235 2.29 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .19.153l.013.01ZM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
          </svg>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
            {safeRender(tour.location)}
          </p>
        </div>

        {/* Name */}
        <h3
          className="font-bold text-slate-800 dark:text-white leading-tight mb-2 group-hover:text-[#31487A] dark:group-hover:text-[#6b8cc7] transition-colors duration-200 line-clamp-2"
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(1rem, 2.5vw, 1.2rem)",
          }}
        >
          {safeRender(tour.name)}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-3 line-clamp-2 flex-1">
          {safeRender(tour.description)}
        </p>

        {/* Facilities */}
        {tour.facilities && tour.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tour.facilities.slice(0, 3).map((f, i) => (
              <span
                key={i}
                className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-full truncate max-w-[100px]"
              >
                ✓ {safeRender(f)}
              </span>
            ))}
            {tour.facilities.length > 3 && (
              <span className="text-[10px] font-semibold text-[#31487A] bg-[#31487A]/10 px-2 py-0.5 rounded-full shrink-0">
                +{tour.facilities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/tour/${tour.id}`}
            className="flex-1 text-center py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-[#31487A] hover:text-[#31487A] dark:hover:text-[#6b8cc7] transition-all no-underline bg-white/50 dark:bg-transparent"
            style={{ minHeight: 40 }}
          >
            Details
          </Link>
          {user ? (
            <Link
              to={`/book/${tour.id}`}
              className="flex-1 text-center py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold no-underline transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #31487A 0%, #4a5a8a 100%)",
                minHeight: 40,
              }}
            >
              Book Now →
            </Link>
          ) : (
            <button
              onClick={handleBookClick}
              className="flex-1 text-center py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 border-none"
              style={{
                background: "linear-gradient(135deg, #31487A 0%, #4a5a8a 100%)",
                minHeight: 40,
              }}
            >
              Book Now →
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* ── Skeleton Card ── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#1a2744] border border-slate-100 dark:border-white/[0.07]">
      <div className="relative w-full pt-[66%] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-white/5 dark:via-white/8 dark:to-white/5 animate-pulse" />
      <div className="p-4 sm:p-5 space-y-3">
        <div className="h-2.5 bg-slate-100 dark:bg-white/8 rounded-full w-1/3 animate-pulse" />
        <div className="h-5 bg-slate-100 dark:bg-white/8 rounded-full w-3/4 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-100 dark:bg-white/8 rounded-full w-full animate-pulse" />
          <div className="h-3 bg-slate-100 dark:bg-white/8 rounded-full w-5/6 animate-pulse" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-9 bg-slate-100 dark:bg-white/8 rounded-xl flex-1 animate-pulse" />
          <div className="h-9 bg-slate-200 dark:bg-white/12 rounded-xl flex-1 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ── Tours Page ── */
export default function ToursPage() {
  const [tours, setTours]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY  = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const heroOp = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    setLoading(true);
    const params = activeCategory !== "all" ? { type: activeCategory } : {};
    fetchDestinations(params)
      .then((r) => setTours(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const displayTours = searchQuery.trim()
    ? tours.filter(
        (t) =>
          safeRender(t.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
          safeRender(t.location).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tours;

  const activeMeta = CATEGORIES.find((c) => c.value === activeCategory) || CATEGORIES[0];

  return (
    <div
      className="pt-[64px] min-h-screen bg-gradient-to-b from-[#f0f4f8] to-[#e8edf3] dark:from-[#0d1527] dark:to-[#0b1220]"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Hide pill scrollbar */}
      <style>{`
        .pill-scroll::-webkit-scrollbar { display: none; }
        .pill-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 640px) {
          .hide-on-mobile { display: none; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden flex items-end"
        style={{ height: "clamp(280px, 42vw, 440px)" }}
      >
        <motion.div style={{ y: heroY }} className="absolute inset-0 scale-110">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=2000&q=90')",
              backgroundSize: "cover",
              backgroundPosition: "center 42%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/75" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 65% at 50% 50%, transparent 35%, rgba(0,0,0,0.45) 100%)",
            }}
          />
          {/* grain */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundSize: "128px",
            }}
          />
        </motion.div>

        <motion.div
          style={{ opacity: heroOp }}
          className="relative z-10 w-full max-w-[1200px] mx-auto px-5 sm:px-8 pb-10 sm:pb-14"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex items-center gap-2 mb-3"
          >
            <span className="block w-6 h-px bg-white/60 rounded-full" />
            <span className="text-white/65 text-[10px] font-semibold tracking-[0.28em] uppercase">
              Handpicked Packages
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.6, ease }}
            className="font-bold text-white leading-[1.05] tracking-tight mb-2"
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2rem, 7vw, 4.5rem)",
            }}
          >
            Tour{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #ffffff 0%, #a8c4e0 55%, #8ba3c4 100%)",
              }}
            >
              Experiences
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.5, ease }}
            className="text-white/65 max-w-xs sm:max-w-md text-sm sm:text-base"
          >
            Expert guides, premium stays, and itineraries crafted to leave you speechless.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Sticky filter bar ── */}
      <div className="sticky top-[64px] z-30 bg-white/92 dark:bg-[#0f172a]/92 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.06] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 py-3 sm:py-3.5">
            {/* Category pills — horizontal scroll */}
            <div className="pill-scroll flex gap-2 overflow-x-auto flex-1 min-w-0 pb-0.5">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.value;
                return (
                  <motion.button
                    key={cat.value}
                    whileHover={{ scale: 1.04, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(cat.value)}
                    className={`shrink-0 flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold cursor-pointer transition-all whitespace-nowrap ${
                      isActive
                        ? "text-white shadow-md"
                        : "text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-transparent hover:border-[#31487A]/50 hover:text-[#31487A] dark:hover:text-[#6b8cc7]"
                    }`}
                    style={
                      isActive
                        ? {
                            background:
                              "linear-gradient(135deg, #31487A 0%, #4a5a8a 100%)",
                            boxShadow: "0 4px 14px rgba(49,72,122,0.38)",
                            minHeight: 36,
                          }
                        : { minHeight: 36 }
                    }
                  >
                    <span className="text-sm sm:text-base">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Search */}
            <div
              className={`relative transition-all duration-200 ${
                searchFocused ? "w-full sm:w-56" : "w-full sm:w-44"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full pl-8 pr-8 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#31487A] focus:ring-2 focus:ring-[#31487A]/20 transition-all"
                style={{ minHeight: 36 }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  style={{ lineHeight: 1 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* Result header */}
        <AnimatePresence mode="wait">
          {!loading && displayTours.length > 0 && (
            <motion.div
              key={activeCategory + searchQuery}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between mb-5 sm:mb-7 flex-wrap gap-2"
            >
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {searchQuery ? (
                  <>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{displayTours.length}</span>
                    {" result"}{displayTours.length !== 1 ? "s" : ""} for{" "}
                    <span className="font-semibold text-[#31487A] dark:text-[#6b8cc7]">"{searchQuery}"</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{displayTours.length}</span>
                    {" tour package"}{displayTours.length !== 1 ? "s" : ""}
                  </>
                )}
              </p>
              {!searchQuery && (
                <motion.div
                  key={activeMeta.value}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#31487A]/10 text-[#31487A] dark:text-[#6b8cc7] dark:bg-[#31487A]/20 border border-[#31487A]/20"
                >
                  <span>{activeMeta.icon}</span>
                  <span>{activeMeta.label}</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid / Skeleton / Empty */}
        {loading ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div key={i} variants={fadeUp}>
                <SkeletonCard />
              </motion.div>
            ))}
          </motion.div>
        ) : displayTours.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease }}
            className="text-center py-20 sm:py-32 flex flex-col items-center"
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 1.5, delay: 0.2, repeat: Infinity, repeatDelay: 3 }}
              className="block mb-5 text-6xl sm:text-8xl"
            >
              🧳
            </motion.span>
            <h3
              className="font-bold text-slate-800 dark:text-white mb-2"
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(1.3rem, 4vw, 1.8rem)",
              }}
            >
              {searchQuery ? "No matching tours" : "No tours found"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-7 max-w-[280px] leading-relaxed">
              {searchQuery
                ? `Nothing matched "${searchQuery}". Try a different term.`
                : "Try a different category to discover more packages."}
            </p>
            <motion.button
              onClick={() =>
                searchQuery ? setSearchQuery("") : setActiveCategory("all")
              }
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="text-white px-8 py-3 rounded-full font-semibold text-sm cursor-pointer shadow-md hover:shadow-xl border-none"
              style={{
                background: "linear-gradient(135deg, #31487A 0%, #4a5a8a 100%)",
                minHeight: 44,
              }}
            >
              {searchQuery ? "Clear Search" : "Show All Tours"}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"
          >
            <AnimatePresence mode="popLayout">
              {displayTours.map((tour, idx) => (
                <TourCard key={tour.id} tour={tour} index={idx} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}