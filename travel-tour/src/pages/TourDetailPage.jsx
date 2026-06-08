import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import ImageSlider from "../components/ImageSlider";
import { fetchDestinationById, fetchReviewsByDestination } from "../api";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

/* ─── Easing & variants ─────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};
const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

/* ─── Star Row ───────────────────────────────────────────────────── */
function StarRow({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 300 }}
          style={{
            color: i < rating ? "#FBBF24" : "transparent",
            WebkitTextStroke: i < rating ? "0" : "1.5px #cbd5e1",
            fontSize: "0.875rem",
          }}
        >
          ★
        </motion.span>
      ))}
    </div>
  );
}

/* ─── Animated Number ────────────────────────────────────────────── */
function AnimatedNumber({ value, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value);
    if (isNaN(end)) return;
    const duration = 900;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(Number.isInteger(end) ? Math.round(start) : start.toFixed(1));
      if (start >= end) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{prefix}{display}{suffix}</>;
}

/* ─── Stat Badge ─────────────────────────────────────────────────── */
function StatBadge({ icon, label, value, delay = 0, animate = false }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      whileHover={{ y: -5, scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className="relative flex flex-col items-center gap-1.5 px-3 py-3 sm:px-4 sm:py-4
        bg-white dark:bg-[#1a2844]
        rounded-2xl shadow-[0_2px_20px_rgba(14,165,233,0.1)]
        border border-slate-100/80 dark:border-white/[0.06]
        hover:border-[#31487A]/40 hover:shadow-[0_8px_32px_rgba(49,72,122,0.18)]
        transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      {/* shimmer on hover */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full
        bg-gradient-to-r from-transparent via-white/10 to-transparent
        transition-transform duration-700 pointer-events-none" />

      <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300 drop-shadow-sm">
        {icon}
      </span>
      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-widest uppercase">
        {label}
      </span>
      <span className="text-[11px] sm:text-sm font-extrabold text-slate-800 dark:text-white text-center leading-tight line-clamp-1">
        {value}
      </span>
    </motion.div>
  );
}

/* ─── Loading Skeleton ───────────────────────────────────────────── */
function LoadingSkeleton() {
  return (
    <div className="pt-[64px] sm:pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-pulse">
        <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-[200px] sm:h-[380px] bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-2xl" />
          ))}
        </div>
        <div className="h-10 w-4/5 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
          <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Section divider ────────────────────────────────────────────── */
function SectionDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
      <span className="text-[#31487A]/40 text-xs">✦</span>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function TourDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("highlights");
  const [realReviews, setRealReviews] = useState([]);
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 300], [0, 60]);

  const addToast = useToast();
  const { isWishlisted, toggleWishlist } = useApp();
  const { user, openAuthModal } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);
    setError(null);
    setRealReviews([]);
    Promise.all([
      fetchDestinationById(id),
      fetchReviewsByDestination(id).catch(() => []),
    ])
      .then(([tourData, reviews]) => {
        setTour(tourData);
        setRealReviews(Array.isArray(reviews) ? reviews : []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error || !tour)
    return (
      <div className="pt-[64px] sm:pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-gradient-to-br from-[#31487A]/20 to-[#4B6DA8]/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-[#31487A]/20"
          >
            <span className="text-5xl">😕</span>
          </motion.div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Tour Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
            {error || "This tour package doesn't exist or has been removed."}
          </p>
          <Link
            to="/destinations"
            className="inline-block bg-gradient-to-r from-[#31487A] to-[#4B6DA8] text-white px-8 py-3.5 rounded-full font-semibold no-underline hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#31487A]/30 transition-all"
          >
            Browse Tours
          </Link>
        </motion.div>
      </div>
    );

  const wishlisted = isWishlisted(tour.id);

  const reviewsList = realReviews.length
    ? realReviews.map((r) => ({
        name: r.user?.name || r.name || "Traveler",
        rating: r.rating || 0,
        text: r.text || r.message || "",
        createdAt: r.createdAt,
      }))
    : (tour.reviews || []).map((r) => ({ name: r.name, rating: r.rating, text: r.text, createdAt: null }));

  const realAvg = reviewsList.length
    ? reviewsList.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviewsList.length
    : null;
  const displayRating = realAvg != null ? realAvg : Number(tour.rating) || 0;

  const tabs = [
    { id: "highlights", label: "Highlights", icon: "✨" },
    { id: "included",   label: "Included",   icon: "📦" },
    { id: "reviews",    label: "Reviews",    icon: "💬", count: reviewsList.length },
  ];

  return (
    <div
      className="pt-[64px] sm:pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >

      {/* ── Hero Strip ─────────────────────────────────────────────── */}
      <div ref={heroRef} className="relative overflow-hidden bg-[#090e1a]">

        {/* Animated mesh blobs */}
        <motion.div
          animate={{ x: [0, 60, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(49,72,122,0.25) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear", delay: 3 }}
          className="absolute -bottom-10 right-10 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(75,109,168,0.25) 0%, transparent 70%)" }}
        />
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear", delay: 6 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[200px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(49,72,122,0.08) 0%, transparent 70%)" }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-1.5 text-xs text-slate-400 mb-5 flex-wrap"
            aria-label="Breadcrumb"
          >
            {[
              { label: "Home", to: "/" },
              { label: "Destinations", to: "/destinations" },
            ].map(({ label, to }, i) => (
              <span key={to} className="flex items-center gap-1.5">
                <Link to={to} className="text-[#6B8CC7] hover:text-white transition-colors font-medium">
                  {label}
                </Link>
                <span className="text-slate-700">/</span>
              </span>
            ))}
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-300 truncate max-w-[200px] font-medium"
            >
              {tour.name}
            </motion.span>
          </motion.nav>

          {/* Meta chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-2.5"
          >
            <motion.span
              whileHover={{ scale: 1.06 }}
              className="capitalize px-3 py-1 bg-[#31487A]/15 text-[#6B8CC7] border border-[#31487A]/25 rounded-full text-xs font-bold tracking-wide backdrop-blur-sm"
            >
              {tour.type}
            </motion.span>
            <span className="flex items-center gap-1.5 text-slate-400 text-xs">
              <span className="text-[#6B8CC7]">📍</span>
              <span>{tour.location}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1.5 text-slate-400 text-xs">
              <span className="text-[#6B8CC7]">⏱</span>
              <span>{tour.duration}</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold">
              ★ {displayRating.toFixed(1)}
              <span className="text-slate-500 font-normal">({reviewsList.length})</span>
            </span>
          </motion.div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 pb-16 md:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] gap-8 xl:gap-12">

          {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-7 sm:space-y-9"
          >

            {/* Image Slider — lifted with shadow halo */}
            <motion.div variants={fadeUp} className="relative group">
              <div
                className="absolute -inset-1 rounded-[28px] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none"
                style={{ background: "linear-gradient(135deg, #31487A, #4B6DA8)" }}
              />
              <div className="relative rounded-2xl sm:rounded-[24px] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.22)] ring-1 ring-white/10">
                <ImageSlider images={tour.images} />

                {/* Price pill overlay on image */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="absolute top-4  bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-sm font-extrabold border border-white/10 shadow-xl"
                >
                  ₹{tour.price.toLocaleString()}
                  <span className="text-[10px] font-normal text-white/60 ml-1">/ person</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Stat badges */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <StatBadge icon="📅" label="Duration" value={tour.duration} delay={0} />
              <StatBadge icon="⭐" label="Rating"   value={`${displayRating.toFixed(1)} / 5.0`} delay={0.08} />
              <StatBadge icon="📍" label="Location" value={tour.location} delay={0.16} />
              <StatBadge icon="🏷️" label="Category" value={tour.type.charAt(0).toUpperCase() + tour.type.slice(1)} delay={0.24} />
            </motion.div>

            {/* Title + description */}
            <motion.div variants={fadeUp}>
              <h1 className="text-2xl sm:text-3xl xl:text-4xl font-extrabold text-slate-800 dark:text-white mb-4 leading-[1.15] tracking-tight">
                {tour.name}
              </h1>
              <SectionDivider />
              <p className="mt-4 text-slate-600 dark:text-slate-300 leading-[1.8] text-sm sm:text-base">
                {tour.description}
              </p>
            </motion.div>

            {/* ── Tab Section ─────────────────────────────────────── */}
            <motion.div variants={fadeUp}>

              {/* Tab bar */}
              <div className="flex gap-1.5 p-1.5 bg-slate-100/80 dark:bg-[#131d35] backdrop-blur-sm rounded-2xl mb-6 border border-slate-200/60 dark:border-white/[0.04]">
                {tabs.map((tab) => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-[#31487A] to-[#4B6DA8] text-white shadow-lg shadow-[#31487A]/25"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden xs:inline">{tab.label}</span>
                    {tab.count != null && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                          activeTab === tab.id
                            ? "bg-white/25 text-white"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        }`}
                      >
                        {tab.count}
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Tab panels */}
              <AnimatePresence mode="wait">

                {/* Highlights */}
                {activeTab === "highlights" && (
                  <motion.div
                    key="highlights"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.28 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                  >
                    {tour.highlights.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ scale: 1.015, y: -2 }}
                        className="flex items-start gap-3 p-3.5 sm:p-4
                          bg-white dark:bg-[#1a2844]
                          rounded-xl border border-slate-100 dark:border-white/[0.05]
                          hover:border-emerald-400/40 hover:shadow-[0_6px_24px_rgba(52,211,153,0.12)]
                          transition-all duration-300 group cursor-pointer"
                      >
                        <span className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-px shadow-sm group-hover:shadow-emerald-400/40 group-hover:scale-110 transition-all">
                          ✓
                        </span>
                        <span className="text-[12px] sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">
                          {item}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Included */}
                {activeTab === "included" && (
                  <motion.div
                    key="included"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.28 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                  >
                    {tour.facilities.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -18 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ scale: 1.015, y: -2 }}
                        className="flex items-start gap-3 p-3.5 sm:p-4
                          bg-white dark:bg-[#1a2844]
                          rounded-xl border border-slate-100 dark:border-white/[0.05]
                          hover:border-[#31487A]/40 hover:shadow-[0_6px_24px_rgba(49,72,122,0.12)]
                          transition-all duration-300 group cursor-pointer"
                      >
                        <span className="w-6 h-6 bg-gradient-to-br from-[#31487A] to-[#4B6DA8] rounded-lg flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-px shadow-sm group-hover:shadow-[#31487A]/40 group-hover:scale-110 transition-all">
                          ✓
                        </span>
                        <span className="text-[12px] sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">
                          {item}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {/* Reviews */}
                {activeTab === "reviews" && (
                  <motion.div
                    key="reviews"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.28 }}
                    className="space-y-4"
                  >
                    {/* Rating summary card */}
                    <motion.div
                      initial={{ scale: 0.97 }}
                      animate={{ scale: 1 }}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-5
                        p-5 sm:p-6
                        bg-white dark:bg-[#1a2844]
                        rounded-2xl border border-slate-100 dark:border-white/[0.05]
                        shadow-[0_4px_24px_rgba(49,72,122,0.06)] mb-6"
                    >
                      {/* Big rating number */}
                      <div className="text-center shrink-0 w-full sm:w-28 sm:border-r sm:border-slate-100 sm:dark:border-white/[0.06] sm:pr-5">
                        <motion.span
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 180 }}
                          className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-br from-[#31487A] to-[#4B6DA8] bg-clip-text text-transparent block leading-none mb-1.5"
                        >
                          {displayRating.toFixed(1)}
                        </motion.span>
                        <StarRow rating={Math.round(displayRating)} />
                        <span className="text-[10px] text-slate-400 mt-1.5 block">
                          {reviewsList.length} review{reviewsList.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Bar chart */}
                      <div className="flex-1 w-full space-y-2 sm:pl-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviewsList.filter((r) => Math.round(r.rating) === star).length;
                          const pct = reviewsList.length ? Math.round((count / reviewsList.length) * 100) : 0;
                          return (
                            <div key={star} className="flex items-center gap-2.5">
                              <span className="text-[10px] text-slate-400 w-3 font-semibold">{star}</span>
                              <span className="text-amber-400 text-[10px] leading-none">★</span>
                              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-[#0f172a] rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 1, delay: (5 - star) * 0.1, ease: [0.22, 1, 0.36, 1] }}
                                  className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 w-5 text-right">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>

                    {reviewsList.length === 0 && (
                      <div className="text-center py-14 text-sm text-slate-400 dark:text-slate-500
                        bg-white dark:bg-[#1a2844] rounded-2xl border border-slate-100 dark:border-white/[0.05]">
                        <span className="text-3xl block mb-3">💬</span>
                        No reviews yet — book this tour and be the first to share your experience.
                      </div>
                    )}

                    {/* Review cards */}
                    {reviewsList.map((r, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        whileHover={{ y: -3 }}
                        className="bg-white dark:bg-[#1a2844] p-5 sm:p-6
                          rounded-2xl border border-slate-100 dark:border-white/[0.05]
                          hover:border-[#31487A]/25 hover:shadow-[0_8px_32px_rgba(49,72,122,0.1)]
                          transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3.5">
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="w-10 h-10 bg-gradient-to-br from-[#31487A] to-[#4B6DA8] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-[#31487A]/25 shrink-0"
                            >
                              {r.name.charAt(0).toUpperCase()}
                            </motion.div>
                            <div>
                              <strong className="text-sm text-slate-800 dark:text-white block leading-tight mb-0.5">
                                {r.name}
                              </strong>
                              <StarRow rating={r.rating} />
                            </div>
                          </div>
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-semibold border border-emerald-100 dark:border-emerald-800/50 w-fit flex items-center gap-1">
                            <span>✓</span> Verified Traveler
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{r.text}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* ── RIGHT COLUMN — Booking Card ─────────────────────────── */}
          <motion.aside
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="lg:sticky lg:top-[90px] self-start mt-2 lg:mt-0"
          >

            {/* Main booking card */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.3 }}
              className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(49,72,122,0.14)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            >
              {/* Glowing border */}
              <div
                className="absolute inset-0 rounded-2xl sm:rounded-3xl pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(49,72,122,0.3), rgba(75,109,168,0.15), transparent)",
                  padding: "1px",
                  WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
              />

              <div className="bg-white dark:bg-[#141f36] border border-slate-200/80 dark:border-white/[0.06] rounded-2xl sm:rounded-3xl overflow-hidden">

                {/* Gradient top bar — thicker, multi-stop */}
                <div className="h-1.5 bg-gradient-to-r from-[#31487A] via-[#6B8CC7] to-[#4B6DA8]" />

                {/* Subtle inner glow */}
                <div
                  className="absolute top-0 left-0 right-0 h-40 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(49,72,122,0.08) 0%, transparent 70%)" }}
                />

                <div className="p-5 sm:p-7 relative z-10">

                  {/* Price block */}
                  <div className="text-center mb-6 pb-6 border-b border-slate-100 dark:border-white/[0.07]">
                    <span className="text-[10px] text-slate-400 tracking-[0.15em] uppercase block mb-2 font-semibold">
                      Starting from
                    </span>
                    <div className="flex items-end justify-center gap-1 mb-1">
                      <motion.span
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-br from-[#31487A] to-[#4B6DA8] bg-clip-text text-transparent"
                      >
                        ₹{tour.price.toLocaleString()}
                      </motion.span>
                    </div>
                    <span className="text-xs text-slate-400">per person</span>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-3 mb-7">
                    {[
                      { icon: "📅", label: "Duration", value: tour.duration },
                      { icon: "⭐", label: "Rating",   value: `${displayRating.toFixed(1)} / 5.0 (${reviewsList.length})` },
                      { icon: "📍", label: "Location", value: tour.location },
                      { icon: "🏷️", label: "Category", value: tour.type.charAt(0).toUpperCase() + tour.type.slice(1) },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.06 }}
                        className="flex items-center gap-3 group"
                      >
                        <span className="w-9 h-9 bg-[#31487A]/8 dark:bg-[#31487A]/10 border border-[#31487A]/15 rounded-xl flex items-center justify-center text-base shrink-0 group-hover:bg-[#31487A]/15 group-hover:border-[#31487A]/30 transition-all">
                          {item.icon}
                        </span>
                        <div className="flex-1 flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{item.label}</span>
                          <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-white/90 text-right max-w-[55%] leading-tight">
                            {item.value}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA: Book */}
                  {user ? (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        to={`/book/${tour.id}`}
                        className="block text-center py-3.5 sm:py-4
                          bg-gradient-to-r from-[#31487A] to-[#4B6DA8]
                          text-white rounded-2xl font-bold text-sm no-underline
                          hover:shadow-[0_12px_40px_rgba(49,72,122,0.45)]
                          transition-all duration-300 mb-3 relative overflow-hidden group"
                      >
                        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 pointer-events-none" />
                        ✈️ Book This Tour
                      </Link>
                    </motion.div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { openAuthModal("login"); addToast("info", "Please login to book this tour"); }}
                      className="w-full text-center py-3.5 sm:py-4
                        bg-gradient-to-r from-[#31487A] to-[#4B6DA8]
                        text-white rounded-2xl font-bold text-sm
                        hover:shadow-[0_12px_40px_rgba(49,72,122,0.45)]
                        transition-all duration-300 mb-3 relative overflow-hidden group cursor-pointer"
                    >
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 pointer-events-none" />
                      ✈️ Book This Tour
                    </motion.button>
                  )}

                  {/* CTA: Wishlist */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      toggleWishlist(tour);
                      addToast(
                        wishlisted ? "error" : "success",
                        wishlisted ? `Removed ${tour.name} from wishlist` : `Added ${tour.name} to wishlist`
                      );
                    }}
                    className={`w-full py-3 border-2 rounded-2xl font-semibold text-xs sm:text-sm transition-all duration-300 cursor-pointer mb-6 flex items-center justify-center gap-2 ${
                      wishlisted
                        ? "border-rose-400 text-rose-500 bg-rose-50 dark:bg-rose-950/30"
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-[#31487A] hover:text-[#31487A] hover:bg-[#31487A]/5"
                    }`}
                  >
                    <motion.span
                      animate={{ scale: wishlisted ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      {wishlisted ? "❤️" : "🤍"}
                    </motion.span>
                    {wishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                  </motion.button>

                  {/* Trust badges */}
                  <div className="space-y-2.5 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                    <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold pt-2 mb-1">Why book with us</p>
                    {[
                      { icon: "🔒", text: "Free cancellation up to 48 hrs before departure" },
                      { icon: "💳", text: "Secure payment — SSL encrypted checkout" },
                      { icon: "🏅", text: "Best price guaranteed — we'll match any quote" },
                    ].map((badge, i) => (
                      <motion.div
                        key={badge.text}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="flex items-start gap-2.5 group cursor-pointer"
                      >
                        <span className="text-sm shrink-0 mt-px">{badge.icon}</span>
                        <span className="text-[10px] sm:text-[11px] text-slate-400 leading-snug group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors">
                          {badge.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Need help card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              whileHover={{ y: -3, scale: 1.01 }}
              className="mt-4 p-4 sm:p-5 relative overflow-hidden
                bg-gradient-to-br from-[#31487A]/10 to-[#4B6DA8]/10
                dark:from-[#31487A]/[0.07] dark:to-[#4B6DA8]/[0.07]
                border border-[#31487A]/20 rounded-2xl
                transition-all duration-300"
            >
              {/* Corner decoration */}
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#31487A]/10 blur-xl pointer-events-none" />

              <p className="text-sm font-bold text-slate-700 dark:text-white mb-1 flex items-center gap-2">
                <span>🎯</span> Need help choosing?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Our travel experts are available 24/7 to help you plan the perfect trip.
              </p>
              <motion.button
                whileHover={{ x: 4 }}
                className="mt-3 text-xs font-bold text-[#31487A] hover:underline cursor-pointer bg-transparent border-none p-0 flex items-center gap-1.5"
              >
                Chat with an expert <span>→</span>
              </motion.button>
            </motion.div>

          </motion.aside>
        </div>
      </div>
    </div>
  );
}