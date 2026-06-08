import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function reviewSummary(review) {
  if (!review) return null;
  const name = review.user?.name || review.name || "Traveler";
  const first = String(name).trim().charAt(0).toUpperCase() || "T";
  const text = String(review.text || review.message || "").trim();
  const snippet = text.length > 110 ? `${text.slice(0, 110)}…` : text;
  return { first, name, snippet, rating: review.rating || 0, createdAt: review.createdAt };
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
}

const TYPE_COLORS = {
  beach:     "bg-sky-100 text-sky-700",
  cultural:  "bg-violet-100 text-violet-700",
  adventure: "bg-orange-100 text-orange-700",
  luxury:    "bg-amber-100 text-amber-700",
};

const cardVariants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export default function DestinationCard({ destination, index = 0, latestReview = null, reviewCount = null, avgRating = null }) {
  const { isWishlisted, toggleWishlist } = useApp();
  const { user, openAuthModal } = useAuth();
  const addToast = useToast();
  const [imgLoaded, setImgLoaded] = useState(false);
  const wishlisted  = isWishlisted(destination.id);
  const badgeClass  = TYPE_COLORS[destination.type] || "bg-slate-100 text-slate-700";
  const review      = reviewSummary(latestReview);
  const showReview  = Boolean(review && review.snippet);
  const realCount   = Number.isFinite(reviewCount) ? reviewCount : null;
  const realAvg     = Number.isFinite(avgRating) ? avgRating : null;
  const displayRating = realAvg != null ? Number(realAvg).toFixed(1) : (destination.rating ?? 0);
  const displayCount  = realCount != null ? realCount : (Array.isArray(destination.reviews) ? destination.reviews.length : 0);

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!user) {
      openAuthModal("login");
      addToast("info", "Please login to save destinations");
      return;
    }
    toggleWishlist(destination);
    addToast(
      wishlisted ? "error" : "success",
      wishlisted ? `Removed ${destination.name} from wishlist` : `Added ${destination.name} to wishlist`
    );
  };

  const handleAuthRequired = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    openAuthModal("login");
    addToast("info", `Please login to ${action}`);
  };

  return (
    <motion.article
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.07 }}
      whileHover={{ y: -8, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      className="relative bg-white dark:bg-[#1E2E4F] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(49,72,122,0.08)] hover:shadow-[0_20px_40px_rgba(49,72,122,0.18)] transition-all duration-300 group flex flex-col ring-1 ring-slate-100 dark:ring-white/5 hover:ring-[#31487A]/30"
    >
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#31487A]/0 to-transparent group-hover:via-[#31487A]/60 transition-all duration-500 z-20 pointer-events-none" />
      {/* Image */}
      <div className="relative h-[220px] overflow-hidden bg-slate-200 dark:bg-slate-700">
        {!imgLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse" />
        )}
        <motion.img
          src={destination.image}
          alt={destination.name}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
          whileHover={{ scale: 1.08 }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />

        {/* Wishlist heart */}
        <motion.button
          onClick={handleWishlist}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.85 }}
          className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-lg shadow-sm z-10"
        >
          <motion.span
            key={wishlisted ? "filled" : "empty"}
            initial={{ scale: 0.5, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            {wishlisted ? "❤️" : "🤍"}
          </motion.span>
        </motion.button>

        {/* Rating */}
        <div className="absolute top-3 right-3 bg-[#1E2E4F]/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10">
          <span className="text-amber-400">★</span>
          {displayRating}
          <span className="opacity-80 font-medium">({displayCount})</span>
        </div>

        {/* Duration */}
        <div className="absolute bottom-3 left-3 bg-[#1E2E4F]/70 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs z-10">
          📅 {destination.duration}
        </div>

        {/* Type */}
        <div className={`absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold capitalize z-10 ${badgeClass}`}>
          {destination.type}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight mb-1">
          {destination.name}
        </h3>
        <p className="text-slate-400 dark:text-slate-500 text-xs mb-1.5 flex items-center gap-1">
          <span>📍</span>{destination.location}
        </p>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-4 flex-1">
          {destination.description.slice(0, 90)}…
        </p>

        {showReview ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative mb-4 p-3.5 rounded-xl bg-gradient-to-br from-[#EBF0FA] via-white to-[#EBF0FA] dark:from-white/5 dark:via-white/3 dark:to-white/5 border border-[#1E3259]/10 dark:border-white/8 shadow-sm"
          >
            <svg
              className="absolute -top-1.5 left-5 w-3 h-3 rotate-45 bg-[#EBF0FA] dark:bg-white/5 border-l border-t border-[#1E3259]/10 dark:border-white/8"
              viewBox="0 0 12 12"
              aria-hidden="true"
            />
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1E3259] via-[#31487A] to-[#4B6DA8] text-white text-[11px] font-bold flex items-center justify-center shrink-0 ring-2 ring-white dark:ring-[#1E2E4F]">
                {review.first}
              </span>
              <span className="text-[11px] font-semibold text-[#1E3259] dark:text-[#7A99CC] truncate">{review.name}</span>
              <div className="ml-auto flex items-center gap-0.5 text-[10px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < Math.round(review.rating) ? "text-amber-400" : "text-slate-300 dark:text-slate-600"}>★</span>
                ))}
              </div>
            </div>
            <p className="text-[11.5px] text-[#4B6DA8] dark:text-slate-300 leading-snug italic">
              “{review.snippet}”
            </p>
            {review.createdAt && (
              <p className="text-[9px] uppercase tracking-wider text-[#7A99CC] dark:text-slate-500 mt-1.5 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
                {formatDate(review.createdAt)} • Verified traveler
              </p>
            )}
          </motion.div>
        ) : displayCount > 0 ? (
          <div className="mb-4 text-[11px] text-[#7A99CC] dark:text-slate-500 italic">
            Be the first to share your experience
          </div>
        ) : null}

        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-slate-400 dark:text-slate-500">From </span>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-[#1E3259] to-[#4B6DA8] bg-clip-text text-transparent">
              ₹{destination.price.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">/person</span>
          </div>
          {user ? (
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to={`/tour/${destination.id}`}
                className="group/btn inline-flex items-center gap-1.5 bg-gradient-to-r from-[#1E3259] via-[#31487A] to-[#4B6DA8] text-white px-4 py-2 rounded-full text-xs font-semibold no-underline shadow-sm hover:shadow-lg hover:shadow-[#31487A]/35 transition-all"
              >
                View Details
                <span className="inline-block transition-transform duration-200 group-hover/btn:translate-x-0.5">→</span>
              </Link>
            </motion.div>
          ) : (
            <motion.button
              onClick={(e) => handleAuthRequired(e, "view tour details")}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="group/btn inline-flex items-center gap-1.5 bg-gradient-to-r from-[#1E3259] via-[#31487A] to-[#4B6DA8] text-white px-4 py-2 rounded-full text-xs font-semibold no-underline shadow-sm hover:shadow-lg hover:shadow-[#31487A]/35 transition-all cursor-pointer border-none"
            >
              View Details
              <span className="inline-block transition-transform duration-200 group-hover/btn:translate-x-0.5">→</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
