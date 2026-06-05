import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageSlider from "../components/ImageSlider";
import Skeleton from "../components/Skeleton";
import { fetchDestinationById } from "../api";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const ease = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } }
};

function StarRow({ rating, max = 5, size = "base" }) {
  const sizeClass = size === "large" ? "text-2xl" : "text-base";
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className={`${sizeClass} transition-colors ${
            i < rating ? "text-amber-400" : "text-slate-200 dark:text-slate-700"
          }`}
        >
          ★
        </motion.span>
      ))}
    </div>
  );
}

function StatBadge({ icon, label, value, delay = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={delay}
      whileHover={{ y: -5, scale: 1.02 }}
      className="flex flex-col items-center gap-1.5 px-3 py-3 sm:px-5 sm:py-4 bg-white dark:bg-[#1E2E4F] rounded-2xl shadow-[0_2px_12px_rgba(49,72,122,0.08)] border border-slate-100 dark:border-white/5 hover:border-[#0EA5E9]/30 hover:shadow-[0_4px_20px_rgba(14,165,233,0.14)] transition-all group cursor-pointer"
    >
      <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform duration-300">{icon}</span>
      <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">{label}</span>
      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white text-center leading-tight">{value}</span>
    </motion.div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-pulse">
        <div className="h-4 w-32 sm:w-48 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-[280px] sm:h-[380px] md:h-[460px] bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-2xl sm:rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-xl sm:rounded-2xl" />
          ))}
        </div>
        <div className="h-8 sm:h-10 w-4/5 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-xl" />
        <div className="h-4 w-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-full" />
        <div className="h-4 w-2/3 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 rounded-full" />
      </div>
    </div>
  );
}

export default function TourDetailPage() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("highlights");
  const addToast = useToast();
  const { isWishlisted, toggleWishlist } = useApp();
  const { user, openAuthModal } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);
    setError(null);
    fetchDestinationById(id)
      .then(setTour)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSkeleton />;

  if (error || !tour)
    return (
      <div
        className="pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c] flex items-center justify-center px-4"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 sm:py-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#0EA5E9]/20 to-[#3B82F6]/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
          >
            <span className="text-4xl sm:text-5xl">😕</span>
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">Tour Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 sm:mb-8 text-sm px-4">
            {error || "This tour package doesn't exist or has been removed."}
          </p>
          <Link
            to="/destinations"
            className="inline-block bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold no-underline hover:-translate-y-0.5 hover:shadow-xl transition-all text-sm sm:text-base"
          >
            Browse Tours
          </Link>
        </motion.div>
      </div>
    );

  const wishlisted = isWishlisted(tour.id);

  const tabs = [
    { id: "highlights", label: "Highlights", icon: "✨", emoji: "⭐" },
    { id: "included",   label: "Included",   icon: "📦", emoji: "🎁" },
    { id: "reviews",    label: "Reviews",    icon: "💬", emoji: "🗣️", count: tour.reviews?.length },
  ];

  return (
    <div
      className="pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Enhanced Hero Strip with Animation */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-r from-[#0c2340] via-[#0f3460] to-[#0c2340] overflow-hidden"
      >
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-16 -left-16 w-48 sm:w-64 h-48 sm:h-64 bg-[#0EA5E9]/20 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div 
          animate={{ x: [0, -80, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute -bottom-10 right-12 sm:right-24 w-36 sm:w-48 h-36 sm:h-48 bg-[#3B82F6]/20 rounded-full blur-3xl pointer-events-none"
        />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-6 relative z-10">
          {/* Breadcrumb */}
          <motion.nav 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4 flex-wrap" 
            aria-label="Breadcrumb"
          >
            <Link to="/" className="text-[#0EA5E9] hover:text-white transition-colors">Home</Link>
            <span className="text-slate-600">/</span>
            <Link to="/destinations" className="text-[#0EA5E9] hover:text-white transition-colors">Destinations</Link>
            <span className="text-slate-600">/</span>
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-300 truncate max-w-[180px] sm:max-w-[220px] font-medium"
            >
              {tour.name}
            </motion.span>
          </motion.nav>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap items-center gap-2 sm:gap-3"
          >
            <motion.span 
              whileHover={{ scale: 1.05 }}
              className="capitalize px-3 py-0.5 sm:py-1 bg-[#0EA5E9]/20 text-[#0EA5E9] border border-[#0EA5E9]/30 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide"
            >
              {tour.type}
            </motion.span>
            <span className="text-slate-400 text-[11px] sm:text-xs flex items-center gap-1">
              <span>📍</span> {tour.location}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 text-[11px] sm:text-xs flex items-center gap-1">
              <span>⏱</span> {tour.duration}
            </span>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-10">
          
          {/* LEFT COLUMN */}
          <motion.div 
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="space-y-6 sm:space-y-8"
          >
            {/* Image slider with badge */}
            <motion.div variants={fadeUp} className="relative">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                <ImageSlider images={tour.images} />
              </div>
              {/* <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-4 left-3 sm:bottom-6 sm:left-6 bg-white/95 dark:bg-[#1E2E4F]/95 backdrop-blur-md px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-full shadow-xl flex items-center gap-2 sm:gap-3 border border-white/50 dark:border-white/10 z-10"
              >
                <StarRow rating={Math.round(tour.rating)} size="base" />
                <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{tour.rating}</span>
                <span className="text-[10px] sm:text-xs text-slate-400">/ 5.0</span>
                <span className="text-[10px] sm:text-xs text-slate-400">({tour.reviews.length} reviews)</span>
              </motion.div> */}
            </motion.div>

            {/* Quick stats row */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <StatBadge icon="📅" label="Duration" value={tour.duration} delay={0} />
              <StatBadge icon="⭐" label="Rating"   value={`${tour.rating} / 5.0`} delay={0.1} />
              <StatBadge icon="📍" label="Location" value={tour.location} delay={0.2} />
              <StatBadge icon="🏷️" label="Category" value={tour.type.charAt(0).toUpperCase() + tour.type.slice(1)} delay={0.3} />
            </motion.div>

            {/* Title + description */}
            <motion.div variants={fadeUp}>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-3 sm:mb-4 leading-tight">
                {tour.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{tour.description}</p>
            </motion.div>

            {/* Tabs section */}
            <motion.div variants={fadeUp}>
  {/* Tab bar - removed w-60 from buttons */}
  <div className="flex gap-1 p-1 sm:w-110 bg-slate-100 dark:bg-[#1E2E4F] rounded-2xl mb-5 sm:mb-6 overflow-x-auto whitespace-nowrap">
    {tabs.map((tab) => (
      <motion.button
        key={tab.id}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setActiveTab(tab.id)}
        className={`px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
          activeTab === tab.id
            ? "bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white shadow-md shadow-[#0EA5E9]/30"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
        }`}
      >
        <span className="text-base sm:text-lg">{tab.icon}</span>
        {/* Show label on all screen sizes, remove hidden class */}
        <span>{tab.label}</span>
        {tab.count != null && (
          <motion.span 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
            }`}
          >
            {tab.count}
          </motion.span>
        )}
      </motion.button>
    ))}
  </div>

  <AnimatePresence mode="wait">
    {/* Highlights panel */}
    {activeTab === "highlights" && (
      <motion.div
        key="highlights"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {tour.highlights.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="flex items-start gap-3 p-3 sm:p-4 bg-white dark:bg-[#1E2E4F] rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-300/50 hover:shadow-lg transition-all group cursor-pointer"
          >
            <motion.span 
              whileHover={{ scale: 1.2, rotate: 360 }}
              className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
            >
              ✓
            </motion.span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">{item}</span>
          </motion.div>
        ))}
      </motion.div>
    )}

    {/* Included panel */}
    {activeTab === "included" && (
      <motion.div
        key="included"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        {tour.facilities.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="flex items-start gap-3 p-3 sm:p-4 bg-white dark:bg-[#1E2E4F] rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/5 hover:border-sky-300/50 hover:shadow-lg transition-all group cursor-pointer"
          >
            <motion.span 
              whileHover={{ scale: 1.2, rotate: 360 }}
              className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-[#0EA5E9] to-[#3B82F6] rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
            >
              ✓
            </motion.span>
            <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">{item}</span>
          </motion.div>
        ))}
      </motion.div>
    )}

    {/* Reviews panel */}
    {activeTab === "reviews" && (
      <motion.div
        key="reviews"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        {/* Rating summary */}
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 p-4 sm:p-5 bg-white dark:bg-[#1E2E4F] rounded-2xl border border-slate-100 dark:border-white/5 mb-5 sm:mb-6"
        >
          <div className="text-center shrink-0 w-full sm:w-auto">
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] bg-clip-text text-transparent block leading-none mb-1"
            >
              {tour.rating}
            </motion.span>
            <StarRow rating={Math.round(tour.rating)} />
            <span className="text-xs text-slate-400 mt-1 block">
              {tour.reviews.length} review{tour.reviews.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex-1 w-full space-y-1.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = tour.reviews.filter((r) => Math.round(r.rating) === star).length;
              const pct = tour.reviews.length ? Math.round((count / tour.reviews.length) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-3">{star}</span>
                  <span className="text-amber-400 text-xs">★</span>
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: star * 0.1 }}
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Review cards */}
        {tour.reviews.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -2, scale: 1.01 }}
            className="bg-white dark:bg-[#1E2E4F] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/5 hover:shadow-xl transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
              <div className="flex items-center gap-3">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#0EA5E9] to-[#3B82F6] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0"
                >
                  {r.name.charAt(0).toUpperCase()}
                </motion.div>
                <div>
                  <strong className="text-sm text-slate-800 dark:text-white block leading-tight">{r.name}</strong>
                  <StarRow rating={r.rating} />
                </div>
              </div>
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-semibold border border-emerald-100 dark:border-emerald-800 w-fit"
              >
                ✓ Verified Traveler
              </motion.span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{r.text}</p>
          </motion.div>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
</motion.div>
          </motion.div>

          {/* RIGHT COLUMN — Booking Card */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="lg:sticky lg:top-[90px] self-start mt-6 lg:mt-0"
          >
            <motion.div 
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-[#1E2E4F] rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl dark:border dark:border-white/5"
            >
              <div className="h-2 bg-gradient-to-r from-[#0EA5E9] via-[#3B82F6] to-[#0EA5E9]" />
              <div className="p-5 sm:p-7">
                {/* Price */}
                <div className="text-center mb-5 pb-5 border-b border-slate-100 dark:border-white/10">
                  <span className="text-[10px] sm:text-xs text-slate-400 tracking-widest uppercase block mb-1">Starting from</span>
                  <div className="flex items-end justify-center gap-1">
                    <motion.span 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] bg-clip-text text-transparent"
                    >
                      ₹{tour.price.toLocaleString()}
                    </motion.span>
                  </div>
                  <span className="text-xs sm:text-sm text-slate-400">per person</span>
                </div>

                {/* Info rows */}
                <div className="space-y-3 mb-6 sm:mb-7">
                  {[
                    { icon: "📅", label: "Duration", value: tour.duration },
                    { icon: "⭐", label: "Rating",   value: `${tour.rating} / 5.0` },
                    { icon: "📍", label: "Location", value: tour.location },
                    { icon: "🏷️", label: "Category", value: tour.type.charAt(0).toUpperCase() + tour.type.slice(1) },
                  ].map((item, i) => (
                    <motion.div 
                      key={item.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center gap-3 group"
                    >
                      <span className="w-8 h-8 sm:w-10 sm:h-10 bg-[#0EA5E9]/10 dark:bg-[#1E2E4F]/5 border border-[#0EA5E9]/20 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0 group-hover:bg-[#0EA5E9]/20 transition-colors">
                        {item.icon}
                      </span>
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-wide">{item.label}</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">{item.value}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* CTA Buttons */}
                {user ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={`/book/${tour.id}`}
                      className="block text-center py-3 sm:py-4 bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base no-underline hover:shadow-xl hover:shadow-[#0EA5E9]/35 transition-all mb-3 relative overflow-hidden group"
                    >
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
                      ✈️ Book This Tour
                    </Link>
                  </motion.div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { openAuthModal("login"); addToast("info", "Please login to book this tour"); }}
                    className="w-full text-center py-3 sm:py-4 bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:shadow-xl hover:shadow-[#0EA5E9]/35 transition-all mb-3 relative overflow-hidden group cursor-pointer"
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
                    ✈️ Book This Tour
                  </motion.button>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    toggleWishlist(tour);
                    addToast(
                      wishlisted ? "error" : "success",
                      wishlisted
                        ? `Removed ${tour.name} from wishlist`
                        : `Added ${tour.name} to wishlist`
                    );
                  }}
                  className={`w-full py-3 sm:py-3.5 border-2 rounded-xl sm:rounded-2xl font-semibold text-xs sm:text-sm transition-all cursor-pointer mb-5 flex items-center justify-center gap-2 ${
                    wishlisted
                      ? "border-rose-400 text-rose-500 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60"
                      : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-[#0EA5E9] hover:text-[#0EA5E9] hover:bg-[#0EA5E9]/5"
                  }`}
                >
                  {wishlisted ? "❤️ Remove from Wishlist" : "🤍 Save to Wishlist"}
                </motion.button>

                {/* Trust badges */}
                <div className="space-y-2 pt-2">
                  {[
                    { icon: "🔒", text: "Free cancellation up to 48 hrs before departure" },
                    { icon: "💳", text: "Secure payment — SSL encrypted" },
                    { icon: "🏅", text: "Best price guaranteed" },
                  ].map((badge, i) => (
                    <motion.div
                      key={badge.text}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-start gap-2 group cursor-pointer"
                    >
                      <motion.span 
                        whileHover={{ scale: 1.2 }}
                        className="text-xs sm:text-sm shrink-0 mt-px"
                      >
                        {badge.icon}
                      </motion.span>
                      <span className="text-[10px] sm:text-xs text-slate-400 leading-snug group-hover:text-slate-500 transition-colors">{badge.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Need help card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ y: -2, scale: 1.01 }}
              className="mt-4 p-4 sm:p-5 bg-gradient-to-br from-[#0EA5E9]/10 to-[#3B82F6]/10 dark:from-[#0EA5E9]/5 dark:to-[#3B82F6]/5 border border-[#0EA5E9]/20 rounded-xl sm:rounded-2xl"
            >
              <p className="text-sm font-semibold text-slate-700 dark:text-white mb-1 flex items-center gap-2">
                <span>🎯</span> Need help choosing?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Our travel experts are available 24/7 to help you plan the perfect trip.
              </p>
              <motion.button 
                whileHover={{ x: 5 }}
                className="mt-3 text-xs font-semibold text-[#0EA5E9] hover:underline cursor-pointer bg-transparent border-none p-0 flex items-center gap-1"
              >
                Chat with an expert →
              </motion.button>
            </motion.div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}