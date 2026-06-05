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
  { value: "all",       label: "All Tours",  icon: "🌍", color: "#31487A" },
  { value: "adventure", label: "Adventure",  icon: "⛰️", color: "#34d399" },
  { value: "beach",     label: "Beach",      icon: "🏖️", color: "#31487A" },
  { value: "cultural",  label: "Cultural",   icon: "🏛️", color: "#a78bfa" },
  { value: "luxury",    label: "Luxury",     icon: "💎", color: "#31487A" },
];

/* ── Helper function to safely render any value ── */
const safeRender = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.join(', ');
    if (value.name) return value.name;
    if (value.text) return value.text;
    return '';
  }
  return String(value);
};

/* ── Enhanced Tour card ── */
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

  const ratingValue = typeof tour.rating === 'object' ? tour.rating?.value || tour.rating?.rating || 4.5 : tour.rating || 4.5;
  const reviewCount = typeof tour.reviews === 'object' ? tour.reviews?.count || tour.reviews?.total || 89 : tour.reviews || 89;

  return (
    <motion.article
      variants={fadeUp}
      layout
      exit={{ opacity: 0, scale: 0.93, y: -10 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 20px 35px -12px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      <div className="dark:bg-[#1E2E4F]/90 dark:backdrop-blur-xl dark:border-white/8 flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl">
        {/* ── Image Container ── */}
        <div className="relative h-[240px] overflow-hidden flex-shrink-0">
          {!imgLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-white/5 dark:via-white/8 dark:to-white/5 animate-pulse" />
          )}
          <motion.img
            src={tour.image}
            alt={safeRender(tour.name)}
            onLoad={() => setImgLoaded(true)}
            className="w-full h-full object-cover"
            style={{ opacity: imgLoaded ? 1 : 0 }}
            animate={{ scale: isHovered ? 1.08 : 1 }}
            transition={{ duration: 0.6, ease }}
            loading="lazy"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
          
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-md shadow-lg"
            style={{
              background: `${catMeta.color}22`,
              border: `1px solid ${catMeta.color}55`,
              color: catMeta.color,
            }}
          >
            <span className="text-sm">{catMeta.icon}</span>
            <span className="capitalize">{safeRender(tour.type)}</span>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.1 }}
            className="absolute top-4 right-4 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full shadow-lg"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-[#31487A] text-xs"
            >
              ★
            </motion.span>
            <span className="text-white text-xs font-semibold">{ratingValue}</span>
            <span className="text-white/50 text-[10px]">({reviewCount})</span>
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 px-5 py-4 flex items-end justify-between">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.2 }}
            >
              <span className="text-white/60 text-[10px] line-through decoration-1">${((tour.price || 0) * 1.2).toFixed(0)}</span>
              <div className="flex items-baseline gap-1">
                <span
                  className="text-white text-[1.8rem] font-bold leading-none"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  ₹{tour.price || 0}
                </span>
                <span className="text-white/60 text-[10px] ml-0.5">/ person</span>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.25 }}
              className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-[#31487A]">
                <path fillRule="evenodd" d="M1 8.74a.74.74 0 0 1 .741-.74H7.26V2.741a.74.74 0 1 1 1.48 0V8h5.52a.74.74 0 1 1 0 1.48H8.74v5.52a.74.74 0 1 1-1.48 0V9.48H1.74A.74.74 0 0 1 1 8.74Z" clipRule="evenodd" />
              </svg>
              <span className="text-white/90 text-[10px] font-medium">{safeRender(tour.duration)}</span>
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col flex-1 p-5">
          <div className="flex items-center gap-1.5 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-[#31487A]">
              <path fillRule="evenodd" d="m7.539 14.841.003.003.002.002a.755.755 0 0 0 .912 0l.002-.002.003-.003.012-.009a5.57 5.57 0 0 0 .19-.153 15.588 15.588 0 0 0 2.046-2.082c1.101-1.362 2.291-3.342 2.291-5.597A5 5 0 0 0 3 8c0 2.255 1.19 4.235 2.29 5.597a15.591 15.591 0 0 0 2.046 2.082 8.916 8.916 0 0 0 .19.153l.013.01ZM8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" clipRule="evenodd" />
            </svg>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {safeRender(tour.location)}
            </p>
          </div>

          <h3
            className="font-bold text-slate-800 dark:text-white text-xl leading-tight mb-2 transition-colors duration-200 group-hover:text-[#31487A] dark:group-hover:text-[#31487A]"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", letterSpacing: "-0.01em" }}
          >
            {safeRender(tour.name)}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-2 flex-1">
            {safeRender(tour.description)}
          </p>

          {tour.facilities && tour.facilities.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {tour.facilities.slice(0, 3).map((facility, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/8 px-2.5 py-1 rounded-full flex items-center gap-1"
                >
                  <span className="text-[9px]">✓</span>
                  {safeRender(facility)}
                </motion.span>
              ))}
              {tour.facilities.length > 3 && (
                <span className="text-[10px] font-semibold text-[#31487A] bg-[#31487A]/10 dark:bg-[#31487A]/15 px-2.5 py-1 rounded-full">
                  +{tour.facilities.length - 3}
                </span>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-auto">
            <Link
              to={`/tour/${tour.id}`}
              className="flex-1 text-center py-2.5 rounded-xl border-2 border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-[#31487A] hover:text-[#31487A] dark:hover:text-[#31487A] dark:hover:border-[#31487A] transition-all duration-200 no-underline bg-white/50 dark:bg-transparent hover:bg-white dark:hover:bg-white/5"
            >
              Details
            </Link>
            {user ? (
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <Link
                  to={`/book/${tour.id}`}
                  className="block text-center py-2.5 rounded-xl text-white text-sm font-semibold no-underline transition-all duration-200 shadow-md hover:shadow-xl"
                  style={{
                    background: "linear-gradient(135deg, #31487A 0%, #31487A 55%, #4a5a8a 100%)",
                  }}
                >
                  Book Now →
                </Link>
              </motion.div>
            ) : (
              <motion.button
                onClick={handleBookClick}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 text-center py-2.5 rounded-xl text-white text-sm font-semibold cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #31487A 0%, #31487A 55%, #4a5a8a 100%)",
                }}
              >
                Book Now →
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ── Enhanced Tours Page ── */
export default function ToursPage() {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredTours, setFilteredTours] = useState([]);

  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOp = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    setLoading(true);
    const params = activeCategory !== "all" ? { type: activeCategory } : {};
    fetchDestinations(params)
      .then((r) => setTours(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeCategory]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredTours(tours);
    } else {
      const filtered = tours.filter(tour =>
        safeRender(tour.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        safeRender(tour.location).toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTours(filtered);
    }
  }, [searchQuery, tours]);

  const activeMeta = CATEGORIES.find((c) => c.value === activeCategory) || CATEGORIES[0];
  const displayTours = searchQuery ? filteredTours : tours;

  return (
    <div
      className="pt-[64px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── Parallax hero with NEW dramatic image ── */}
      <section ref={heroRef} className="relative h-[320px] md:h-[420px] overflow-hidden flex items-end">
        <motion.div style={{ y: heroY }} className="absolute inset-0 scale-110">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=2000&q=90')",
              backgroundSize: "cover",
              backgroundPosition: "center 45%",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 65% at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)" }} />
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat", backgroundSize: "128px",
          }} />
        </motion.div>

        <motion.div
          style={{ opacity: heroOp }}
          className="relative z-10 w-full max-w-[1200px] mx-auto px-6 pb-12"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="flex items-center gap-2 mb-4"
          >
            <span className="block w-8 h-px bg-gradient-to-r from-transparent to-white/60" />
            <span className="text-white/80 text-[10px] font-bold tracking-[0.22em] uppercase">
              Handpicked Packages
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease }}
            className="text-[clamp(2.8rem,7vw,4.5rem)] font-bold text-white leading-[1.05] tracking-tight mb-3"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Tour{" "}
            <span className="bg-clip-text text-transparent" style={{
              backgroundImage: "linear-gradient(135deg, #ffffff 0%, #a8c4e0 50%, #8ba3c4 100%)"
            }}>
              Experiences
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.55, ease }}
            className="text-white/70 text-base max-w-[420px]"
          >
            Expert guides, premium stays, and itineraries crafted to leave you speechless.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Sticky Category & Search Bar ── */}
      <div className="sticky top-[64px] z-30 bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-5 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-wrap justify-center">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.value;
                return (
                  <motion.button
                    key={cat.value}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setActiveCategory(cat.value)}
                    className={`relative px-5 py-2.5 rounded-full text-sm font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${
                      isActive
                        ? "text-white shadow-lg"
                        : "text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-transparent hover:border-[#31487A] hover:text-[#31487A] dark:hover:text-[#31487A]"
                    }`}
                    style={isActive ? {
                      background: "linear-gradient(135deg, #31487A 0%, #31487A 55%, #4a5a8a 100%)",
                      boxShadow: "0 4px 18px rgba(49,72,122,0.35)",
                    } : {}}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </motion.button>
                );
              })}
            </div>

            <div className="relative min-w-[240px]">
              <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tours..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-sm focus:outline-none focus:border-[#31487A] focus:ring-2 focus:ring-[#31487A]/20 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-[1200px] mx-auto px-5 py-10">

        <AnimatePresence mode="wait">
          {!loading && displayTours.length > 0 && (
            <motion.div
              key={activeCategory + searchQuery}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between mb-8 flex-wrap gap-3"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-[#31487A] to-[#4a5a8a] flex items-center justify-center shadow-md"
                >
                  <span className="text-white text-xs font-bold">{displayTours.length}</span>
                </motion.div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {searchQuery ? `Found ${displayTours.length} tours matching "${searchQuery}"` : `${displayTours.length} amazing tour packages`}
                </p>
              </div>
              
              {!searchQuery && (
                <motion.div
                  key={activeMeta.value}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                  style={{
                    background: `${activeMeta.color}15`,
                    color: activeMeta.color,
                    border: `1px solid ${activeMeta.color}30`,
                  }}
                >
                  <span>{activeMeta.icon}</span>
                  <span>{activeMeta.label}</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
                className="rounded-2xl overflow-hidden bg-white/70 dark:bg-[#1E2E4F]/80 border border-slate-200 dark:border-slate-700"
              >
                <div className="h-[240px] bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-white/5 dark:via-white/8 dark:to-white/5 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full w-1/3 animate-pulse" />
                  <div className="h-6 bg-slate-200 dark:bg-white/10 rounded-full w-3/4 animate-pulse" />
                  <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full w-2/3 animate-pulse" />
                  <div className="flex gap-3 pt-2">
                    <div className="h-10 bg-slate-200 dark:bg-white/10 rounded-xl flex-1 animate-pulse" />
                    <div className="h-10 bg-slate-200 dark:bg-white/10 rounded-xl flex-1 animate-pulse" />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : displayTours.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease }}
            className="text-center py-32 flex flex-col items-center"
          >
            <motion.span
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 1.5, delay: 0.2, repeat: Infinity, repeatDelay: 3 }}
              className="text-7xl block mb-6"
            >
              🧳
            </motion.span>
            <h3
              className="text-2xl font-bold text-slate-800 dark:text-white mb-3"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              {searchQuery ? "No matching tours" : "No tours found"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 max-w-[280px]">
              {searchQuery 
                ? `We couldn't find any tours matching "${searchQuery}". Try a different search term.`
                : "Try a different category to discover more packages."}
            </p>
            {searchQuery ? (
              <motion.button
                onClick={() => setSearchQuery("")}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="text-white px-8 py-3 rounded-full font-semibold text-sm cursor-pointer shadow-md hover:shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #31487A 0%, #31487A 50%, #4a5a8a 100%)",
                }}
              >
                Clear Search
              </motion.button>
            ) : (
              <motion.button
                onClick={() => setActiveCategory("all")}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="text-white px-8 py-3 rounded-full font-semibold text-sm cursor-pointer shadow-md hover:shadow-xl"
                style={{
                  background: "linear-gradient(135deg, #31487A 0%, #31487A 50%, #4a5a8a 100%)",
                }}
              >
                Show All Tours
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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