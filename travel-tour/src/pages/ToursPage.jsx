import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { fetchDestinations } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const ease = [0.22, 1, 0.36, 1];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease } },
};

const CATEGORIES = [
  { value: "all",       label: "All Tours",  icon: "🌍", color: "#38bdf8" },
  { value: "adventure", label: "Adventure",  icon: "⛰️", color: "#34d399" },
  { value: "beach",     label: "Beach",      icon: "🏖️", color: "#38bdf8" },
  { value: "cultural",  label: "Cultural",   icon: "🏛️", color: "#a78bfa" },
  { value: "luxury",    label: "Luxury",     icon: "💎", color: "#38bdf8" },
];

/* ── Tour card ── */
function TourCard({ tour }) {
  const catMeta = CATEGORIES.find((c) => c.value === tour.type) || CATEGORIES[0];
  const [imgLoaded, setImgLoaded] = useState(false);
  const { user, openAuthModal } = useAuth();
  const addToast = useToast();

  const handleBookClick = (e) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("login");
      addToast("info", "Please login to book tours");
    }
  };

  return (
    <motion.article
      variants={fadeUp}
      layout
      exit={{ opacity: 0, scale: 0.93, y: -10 }}
      className="group relative flex flex-col rounded-3xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.72)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.05)",
      }}
    >
      {/* dark mode handled inline */}
      <div className="dark:bg-[#0d1f35]/80 dark:border-white/7 flex flex-col h-full rounded-3xl overflow-hidden">

        {/* ── Image ── */}
        <div className="relative h-[220px] overflow-hidden flex-shrink-0">
          {/* skeleton shimmer */}
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-white/5 dark:via-white/8 dark:to-white/5 animate-pulse" />
          )}
          <motion.img
            src={tour.image}
            alt={tour.name}
            onLoad={() => setImgLoaded(true)}
            className="w-full h-full object-cover"
            style={{ opacity: imgLoaded ? 1 : 0 }}
            whileHover={{ scale: 1.07 }}
            transition={{ duration: 0.55, ease }}
            loading="lazy"
          />
          {/* image overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />

          {/* Category badge */}
          <div
            className="absolute top-3.5 left-3.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md"
            style={{
              background: `${catMeta.color}22`,
              border: `1px solid ${catMeta.color}55`,
              color: catMeta.color,
            }}
          >
            <span>{catMeta.icon}</span>
            <span className="capitalize">{tour.type}</span>
          </div>

          {/* Rating */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-1 bg-black/40 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-full">
            <span className="text-[#38bdf8]">★</span>
            <span>{tour.rating}</span>
          </div>

          {/* Price overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 flex items-end justify-between">
            <div>
              <span
                className="text-white text-[1.6rem] font-bold leading-none"
                style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
              >
                ${tour.price}
              </span>
              <span className="text-white/60 text-xs ml-1.5">/ person</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md text-white/80 text-[11px] px-2.5 py-1.5 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 opacity-70">
                <path fillRule="evenodd" d="M1 8.74a.74.74 0 0 1 .741-.74H7.26V2.741a.74.74 0 1 1 1.48 0V8h5.52a.74.74 0 1 1 0 1.48H8.74v5.52a.74.74 0 1 1-1.48 0V9.48H1.74A.74.74 0 0 1 1 8.74Z" clipRule="evenodd" />
              </svg>
              {tour.duration}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col flex-1 p-5">
          {/* Location */}
          <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
              <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 8c0 2.255 1.19 4.235 2.29 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .19.153l.013.01ZM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
            </svg>
            {tour.location}
          </p>

          {/* Title */}
          <h3
            className="font-bold text-slate-800 dark:text-white text-lg leading-snug mb-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "-0.01em" }}
          >
            {tour.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2 flex-1">
            {tour.description}
          </p>

          {/* Facility chips */}
          {tour.facilities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {tour.facilities.slice(0, 3).map((f) => (
                <span
                  key={f}
                  className="text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-[#f2f0eb] dark:bg-white/5 px-2.5 py-1 rounded-full"
                >
                  {f}
                </span>
              ))}
              {tour.facilities.length > 3 && (
                <span className="text-[10px] font-semibold text-[#0ea5e9] dark:text-[#38bdf8] bg-[#38bdf8]/10 dark:bg-[#38bdf8]/8 px-2.5 py-1 rounded-full">
                  +{tour.facilities.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 mt-auto">
            <Link
              to={`/tour/${tour.id}`}
              className="flex-1 text-center py-2.5 rounded-xl border-2 border-[#e2ddd5] dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-[#38bdf8] hover:text-[#0ea5e9] dark:hover:text-[#38bdf8] dark:hover:border-[#38bdf8] transition-all no-underline"
            >
              Details
            </Link>
            {user ? (
              <Link
                to={`/book/${tour.id}`}
                className="flex-1 text-center py-2.5 rounded-xl text-white text-sm font-semibold no-underline transition-all hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 55%, #6366f1 100%)",
                  boxShadow: "0 4px 16px rgba(14,165,233,0.28)",
                }}
              >
                Book Now
              </Link>
            ) : (
              <button
                onClick={handleBookClick}
                className="flex-1 text-center py-2.5 rounded-xl text-white text-sm font-semibold no-underline transition-all hover:-translate-y-0.5 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 55%, #6366f1 100%)",
                  boxShadow: "0 4px 16px rgba(14,165,233,0.28)",
                }}
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ── Page ── */
export default function ToursPage() {
  const [tours, setTours]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY  = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOp = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    setLoading(true);
    const params = activeCategory !== "all" ? { type: activeCategory } : {};
    fetchDestinations(params)
      .then((r) => setTours(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const activeMeta = CATEGORIES.find((c) => c.value === activeCategory) || CATEGORIES[0];

  return (
    <div
      className="pt-[64px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Parallax hero ── */}
      <section ref={heroRef} className="relative h-[280px] md:h-[380px] overflow-hidden flex items-end">
        <motion.div style={{ y: heroY }} className="absolute inset-0 scale-110">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1800&q=85')",
              backgroundSize: "cover",
              backgroundPosition: "center 55%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06111f]/50 via-[#06111f]/20 to-[#06111f]/82" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 65% at 50% 50%, transparent 30%, #06111f 100%)" }} />
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
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="flex items-center gap-2 mb-3"
          >
            <span className="block w-6 h-px bg-gradient-to-r from-transparent to-[#38bdf8]" />
            <span className="text-[#38bdf8] text-[10px] font-bold tracking-[0.22em] uppercase">
              Handpicked Packages
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.65, ease }}
            className="text-[clamp(2.4rem,6vw,4.2rem)] font-bold text-white leading-[0.95] tracking-tight mb-3"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Tour{" "}
            <span className="bg-clip-text text-transparent" style={{
              backgroundImage: "linear-gradient(110deg, #38bdf8 0%, #60a5fa 50%, #6366f1 100%)"
            }}>
              Experiences
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55, ease }}
            className="text-white/65 text-base max-w-[400px]"
          >
            Expert guides, premium stays, and itineraries crafted to leave you speechless.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Category filter row — floats over hero bottom ── */}
      <div className="max-w-[1200px] mx-auto px-5 -mt-5 relative z-20 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease }}
          className="flex gap-2 flex-wrap"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.value;
            return (
              <motion.button
                key={cat.value}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveCategory(cat.value)}
                className={`relative px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all flex items-center gap-1.5 overflow-hidden ${
                  isActive
                    ? "text-white shadow-lg"
                    : "text-slate-600 dark:text-slate-400 border-2 border-[#e2ddd5] dark:border-white/10 bg-white/80 dark:bg-transparent backdrop-blur-md hover:border-[#38bdf8] hover:text-[#0ea5e9] dark:hover:text-[#38bdf8]"
                }`}
                style={isActive ? {
                  background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 55%, #6366f1 100%)",
                  boxShadow: "0 4px 18px rgba(14,165,233,0.38)",
                  border: "2px solid transparent",
                } : {}}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1200px] mx-auto px-5 pb-16">

        {/* Result count + label */}
        <AnimatePresence mode="wait">
          {!loading && tours.length > 0 && (
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between mb-7"
            >
              <p className="text-sm text-slate-400 dark:text-slate-500 flex items-center gap-2">
                <span
                  className="font-bold text-slate-700 dark:text-slate-200 text-lg"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {tours.length}
                </span>
                <span>tour package{tours.length !== 1 ? "s" : ""}</span>
              </p>
              <motion.div
                key={activeMeta.value}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{
                  background: `${activeMeta.color}18`,
                  color: activeMeta.color,
                  border: `1px solid ${activeMeta.color}40`,
                }}
              >
                <span>{activeMeta.icon}</span>
                <span>{activeMeta.label}</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── States ── */}
        {loading ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="rounded-3xl overflow-hidden"
                style={{ border: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="h-[220px] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-white/5 dark:via-white/8 dark:to-white/5 animate-pulse" />
                <div className="p-5 space-y-3 bg-white/72 dark:bg-[#0d1f35]/80">
                  <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full w-1/3 animate-pulse" />
                  <div className="h-5 bg-slate-100 dark:bg-white/5 rounded-full w-3/4 animate-pulse" />
                  <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-full w-2/3 animate-pulse" />
                  <div className="flex gap-2 pt-1">
                    <div className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex-1 animate-pulse" />
                    <div className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex-1 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : tours.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease }}
            className="text-center py-24 flex flex-col items-center"
          >
            <motion.span
              animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
              transition={{ duration: 1.2, delay: 0.3 }}
              className="text-6xl block mb-5"
            >
              🧳
            </motion.span>
            <h3
              className="text-2xl font-bold text-slate-800 dark:text-white mb-2"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              No tours found
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-sm mb-7 max-w-[260px]">
              Try a different category to discover more packages.
            </p>
            <motion.button
              onClick={() => setActiveCategory("all")}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="text-white px-8 py-3 rounded-full font-semibold text-sm border-none cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 50%, #6366f1 100%)",
                boxShadow: "0 6px 24px rgba(14,165,233,0.32)",
              }}
            >
              Show All Tours
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {tours.map((tour) => (
                <TourCard key={tour.id} tour={tour} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}