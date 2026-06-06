import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

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

export default function DestinationCard({ destination, index = 0 }) {
  const { isWishlisted, toggleWishlist } = useApp();
  const { user, openAuthModal } = useAuth();
  const addToast = useToast();
  const [imgLoaded, setImgLoaded] = useState(false);
  const wishlisted  = isWishlisted(destination.id);
  const badgeClass  = TYPE_COLORS[destination.type] || "bg-slate-100 text-slate-700";

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
      className="bg-white dark:bg-[#1E2E4F] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(49,72,122,0.08)] hover:shadow-[0_20px_40px_rgba(49,72,122,0.18)] transition-shadow duration-300 group flex flex-col"
    >
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
          {destination.rating}
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

        <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/10">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs text-slate-400 dark:text-slate-500">From </span>
            <span className="text-xl font-extrabold text-[#31487A]">
              ₹{destination.price.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">/person</span>
          </div>
          {user ? (
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
              <Link
                to={`/tour/${destination.id}`}
                className="bg-gradient-to-r from-[#31487A] to-[#31487A] text-white px-4 py-2 rounded-full text-xs font-semibold no-underline shadow-sm hover:shadow-lg hover:shadow-[#31487A]/35 transition-shadow"
              >
                View Details →
              </Link>
            </motion.div>
          ) : (
            <motion.button
              onClick={(e) => handleAuthRequired(e, "view tour details")}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="bg-gradient-to-r from-[#31487A] to-[#31487A] text-white px-4 py-2 rounded-full text-xs font-semibold no-underline shadow-sm hover:shadow-lg hover:shadow-[#31487A]/35 transition-shadow"
            >
              View Details →
            </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
