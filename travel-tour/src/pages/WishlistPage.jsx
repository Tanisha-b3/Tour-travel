import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 22 } },
  exit: { opacity: 0, scale: 0.9, y: -12, transition: { duration: 0.2 } },
};

export default function WishlistPage() {
  const { wishlist, toggleWishlist } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const stats = {
    total: wishlist.length,
    categories: [...new Set(wishlist.map((d) => d.type || d.category || "Other"))],
    avgRating: wishlist.length
      ? (wishlist.reduce((a, d) => a + (d.rating || 0), 0) / wishlist.length).toFixed(1)
      : "0",
    totalPrice: wishlist.reduce((a, d) => a + (d.price || 0), 0),
  };

  const handleRemove = (id) => {
    setRemovingId(id);
    setTimeout(() => {
      toggleWishlist(wishlist.find((d) => d.id === id));
      setRemovingId(null);
    }, 200);
  };

  const clearAll = () => {
    wishlist.forEach((d) => toggleWishlist(d));
    setShowClearConfirm(false);
  };

  return (
    <div className="pt-[70px] min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-[#0f172a] dark:via-[#0f172a] dark:to-[#0a0f1c]">
      {/* ── Enhanced Hero Section ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
        {/* Animated background elements */}
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 -left-20 w-72 h-72 bg-[#0EA5E9]/20 rounded-full blur-3xl"
        />
        <motion.div 
          animate={{ x: [0, -80, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 2 }}
          className="absolute -bottom-10 right-10 w-96 h-96 bg-[#3B82F6]/15 rounded-full blur-3xl"
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="relative max-w-[1200px] mx-auto px-6 py-16 md:py-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                </svg>
              </motion.div>
              <div>
                <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">Your Collection</span>
                <h1 className="text-4xl md:text-6xl font-black text-white mb-2 leading-tight">
                  Wishlist
                </h1>
              </div>
            </div>
            <p className="text-white/80 text-base max-w-xl">
              {wishlist.length > 0
                ? `${wishlist.length} destination${wishlist.length > 1 ? "s" : ""} waiting to be explored`
                : "Start saving destinations to plan your dream trip"}
            </p>
          </motion.div>

          {wishlist.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3 mt-8"
            >
              {[
                { label: stats.total, sub: "Saved", icon: "❤️", color: "rose" },
                { label: stats.avgRating, sub: "Avg Rating", icon: "⭐", color: "amber" },
                { label: stats.categories.length, sub: "Categories", icon: "🎯", color: "emerald" },
                { label: `\u20B9${stats.totalPrice.toLocaleString()}`, sub: "Total Value", icon: "💰", color: "blue" },
              ].map((s, i) => (
                <motion.div
                  key={s.sub}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 hover:bg-white/15 transition-all"
                >
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <span className="text-white font-bold text-xl leading-none">{s.label}</span>
                    <span className="text-white/50 text-[10px] font-medium block">{s.sub}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {wishlist.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-20"
            >
              <div className="max-w-md mx-auto text-center">
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-900/30 dark:to-rose-800/20 flex items-center justify-center shadow-xl"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-11 h-11 text-rose-400">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                  </svg>
                </motion.div>

                <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">Your wishlist is empty</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 leading-relaxed max-w-sm mx-auto">
                  Browse our destinations and tap the heart icon to save your favorites for later.
                </p>

                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to="/destinations"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white px-8 py-3.5 rounded-full font-semibold no-underline shadow-lg shadow-[#0EA5E9]/25 hover:shadow-xl transition-all"
                  >
                    Explore Destinations
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </motion.div>

                <div className="mt-16">
                  <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-5 flex items-center justify-center gap-2">
                    <span className="w-8 h-px bg-slate-300 dark:bg-slate-600" />
                    Trending Destinations
                    <span className="w-8 h-px bg-slate-300 dark:bg-slate-600" />
                  </p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    {["Bali", "Maldives", "Swiss Alps", "Santorini", "Tokyo", "Paris"].map((place, i) => (
                      <motion.div
                        key={place}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                      >
                        <Link
                          to={`/destinations?search=${place}`}
                          className="px-4 py-2 bg-white dark:bg-[#1E2E4F] rounded-full text-sm text-slate-600 dark:text-slate-300 hover:text-[#0EA5E9] dark:hover:text-[#0EA5E9] shadow-sm border border-slate-200 dark:border-white/10 hover:border-[#0EA5E9]/30 hover:shadow-md transition-all no-underline"
                        >
                          {place}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="filled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* ── Enhanced Toolbar ── */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0EA5E9] to-[#3B82F6] flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{stats.total}</span>
                    </div>
                    <div>
                      <span className="text-sm text-slate-500 dark:text-slate-400">Saved Destinations</span>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{stats.categories.length} categories</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex gap-2">
                    {stats.categories.slice(0, 3).map((cat) => (
                      <span key={cat} className="px-3 py-1 bg-[#0EA5E9]/10 text-[#0EA5E9] text-[11px] font-semibold rounded-full capitalize">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {wishlist.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowClearConfirm(true)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all flex items-center gap-1.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482 41.03 41.03 0 0 0-2.365-.298V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4.5c-.854 0-1.694.053-2.5.15V3.75c0-.69.56-1.25 1.25-1.25h2.5c.69 0 1.25.56 1.25 1.25v.9c-.806-.097-1.646-.15-2.5-.15ZM8.75 7a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75ZM11.25 7a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0v-5.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                      </svg>
                      Clear All
                    </motion.button>
                  )}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      to="/destinations"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white text-sm font-semibold hover:shadow-lg transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                      </svg>
                      Add More
                    </Link>
                  </motion.div>
                </div>
              </div>

              {/* ── Enhanced Clear Confirm Modal ── */}
              <AnimatePresence>
                {showClearConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-white/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-white">
                          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                        </svg>
                      </motion.div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Remove all destinations?</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                        This will remove all {wishlist.length} saved destination{wishlist.length > 1 ? "s" : ""} from your wishlist.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          Cancel
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={clearAll}
                          className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold hover:shadow-lg transition-all"
                        >
                          Remove All
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Enhanced Grid ── */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence mode="popLayout">
                  {wishlist.map((dest, i) => (
                    <motion.div
                      key={dest.id}
                      variants={cardVariants}
                      exit="exit"
                      layout
                      className={`group relative bg-white dark:bg-[#1E293B] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100 dark:border-white/10 ${
                        removingId === dest.id ? "opacity-50" : ""
                      }`}
                    >
                      {/* Image Container */}
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={dest.image}
                          alt={dest.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          loading="lazy"
                        />

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                        {/* Price badge */}
                        <motion.div 
                          initial={{ x: -20, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="absolute bottom-3 left-3 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-sm text-slate-800 dark:text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg"
                        >
                          ₹{dest.price?.toLocaleString()}
                        </motion.div>

                        {/* Remove button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemove(dest.id)}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all duration-300"
                          aria-label="Remove from wishlist"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-white">
                            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                          </svg>
                        </motion.button>

                        {/* Top pick badge */}
                        {i === 0 && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
                            </svg>
                            Top Pick
                          </motion.div>
                        )}

                        {/* Rating badge */}
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                          <span className="text-amber-400">★</span>
                          {dest.rating}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-bold text-slate-800 dark:text-white text-base leading-tight group-hover:text-[#0EA5E9] transition-colors">
                            {dest.name}
                          </h3>
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full bg-gradient-to-r from-[#0EA5E9]/10 to-[#3B82F6]/10 text-[#0EA5E9] capitalize border border-[#0EA5E9]/20">
                            {dest.type || "Tour"}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
                          <span>📍</span>
                          {dest.location}
                        </p>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-2">
                          {dest.description?.slice(0, 100)}…
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mb-4">
                          <span className="flex items-center gap-1">📅 {dest.duration}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                          <span className="flex items-center gap-1">⭐ {dest.rating}</span>
                        </div>

                        <div className="flex gap-2">
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                            <Link
                              to={`/tour/${dest.id}`}
                              className="block text-center py-2.5 rounded-xl bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white text-xs font-semibold no-underline hover:shadow-md transition-all"
                            >
                              View Details
                            </Link>
                          </motion.div>
                          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Link
                              to={`/book/${dest.id}`}
                              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 hover:border-[#0EA5E9]/30 transition-all no-underline"
                            >
                              Book
                            </Link>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}