import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchDestinations,
  fetchDestinationTypes,
  fetchMyBookings,
  fetchWishlist,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useApp } from "../context/AppContext";
import DestinationCard from "../components/DestinationCard";
import { CardSkeleton } from "../components/Skeleton";

const ease = [0.22, 1, 0.36, 1];

function formatINR(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function shuffle(arr, n) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

export default function RecommendationsPage() {
  const { darkMode } = useTheme();
  const { user, token } = useAuth();
  const { wishlist, isWishlisted: ctxIsWishlisted, toggleWishlist } = useApp();
  const addToast = useToast();
  const navigate = useNavigate();

  const [allDestinations, setAllDestinations] = useState([]);
  const [types, setTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [serverWishlist, setServerWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDestinations({ limit: 100 }),
      fetchDestinationTypes(),
      token ? fetchMyBookings(token, { limit: 100 }) : Promise.resolve({ data: [] }),
      token ? fetchWishlist(token) : Promise.resolve([]),
    ])
      .then(([dRes, tRes, bRes, wRes]) => {
        setAllDestinations(dRes.data || []);
        setTypes(tRes || []);
        setBookings(bRes.data || bRes || []);
        setServerWishlist(Array.isArray(wRes) ? wRes : wRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const wishlistIds = useMemo(() => {
    const ids = new Set();
    [...(wishlist || []), ...(serverWishlist || [])].forEach((w) => {
      const id = typeof w === "object" ? (w.id ?? w.destinationId) : w;
      if (id !== undefined && id !== null) ids.add(String(id));
    });
    return ids;
  }, [wishlist, serverWishlist]);

  const isInWishlist = (id) => wishlistIds.has(String(id)) || ctxIsWishlisted(id);

  const handleToggle = (dest) => {
    if (!token) {
      addToast("info", "Please sign in to save destinations.");
      return;
    }
    const was = isInWishlist(dest.id);
    toggleWishlist(dest);
    addToast("success", was ? `Removed ${dest.name} from wishlist` : `Added ${dest.name} to wishlist`);
  };

  const forYou = useMemo(() => {
    if (!allDestinations.length) return [];
    const bookedIds = new Set(bookings.map((b) => String(b.tourId ?? b.destinationId ?? "")));
    const wishlistDestIds = new Set(
      [...(wishlist || []), ...(serverWishlist || [])].map((w) => String(typeof w === "object" ? w.destinationId ?? w.id : w))
    );
    const favouriteTypes = new Set();
    const favouriteLocations = new Set();
    allDestinations.forEach((d) => {
      if (bookedIds.has(String(d.id)) || wishlistDestIds.has(String(d.id))) {
        if (d.type) favouriteTypes.add(d.type);
        if (d.region) favouriteLocations.add(d.region);
        if (d.location) favouriteLocations.add(d.location.split(",").pop().trim());
      }
    });
    let ranked = allDestinations.map((d) => {
      let score = 0;
      if (favouriteTypes.has(d.type)) score += 40;
      if ([...favouriteLocations].some((loc) => d.location?.includes(loc) || d.region?.includes(loc))) score += 25;
      if (bookedIds.has(String(d.id)) || wishlistDestIds.has(String(d.id))) score -= 50;
      score += (d.rating || 0) * 5;
      return { d, score };
    });
    if (favouriteTypes.size === 0 && wishlistDestIds.size === 0 && bookedIds.size === 0) {
      ranked = allDestinations.map((d) => ({ d, score: (d.rating || 0) * 5 + Math.random() * 8 }));
    }
    return ranked.sort((a, b) => b.score - a.score).slice(0, 6).map((r) => r.d);
  }, [allDestinations, bookings, wishlist, serverWishlist]);

  const trending = useMemo(
    () => [...allDestinations].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6),
    [allDestinations]
  );

  const similarToFavourites = useMemo(() => {
    if (!allDestinations.length) return [];
    const favIds = new Set(
      [...(wishlist || []), ...(serverWishlist || [])].map((w) => String(typeof w === "object" ? w.destinationId ?? w.id : w))
    );
    const favDests = allDestinations.filter((d) => favIds.has(String(d.id)));
    if (favDests.length === 0) return [];
    const favTypes = new Set(favDests.map((d) => d.type).filter(Boolean));
    return allDestinations
      .filter((d) => !favIds.has(String(d.id)) && favTypes.has(d.type))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4);
  }, [allDestinations, wishlist, serverWishlist]);

  const byBudget = useMemo(() => {
    if (!allDestinations.length) return { min: 0, max: 0, picks: [] };
    const prices = allDestinations.map((d) => d.price || 0).filter(Boolean).sort((a, b) => a - b);
    if (!prices.length) return { min: 0, max: 0, picks: [] };
    const median = prices[Math.floor(prices.length / 2)];
    return {
      min: prices[0],
      max: prices[prices.length - 1],
      median,
      picks: shuffle(allDestinations.filter((d) => (d.price || 0) <= median), 4),
    };
  }, [allDestinations]);

  const filteredForYou = useMemo(
    () => (activeType ? forYou.filter((d) => d.type === activeType) : forYou),
    [forYou, activeType]
  );

  const hasPersonalData = bookings.length > 0 || wishlistIds.size > 0;

  return (
    <div
      className="pt-[88px] min-h-screen bg-[#f8f6f1] dark:bg-[#192338]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="mb-8"
        >
          <span className="inline-block px-4 py-1 bg-[#31487A]/10 text-[#31487A] rounded-full text-[11px] font-bold tracking-wider mb-3 uppercase">
            Curated for you
          </span>
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Personalized Recommendations
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
            {hasPersonalData
              ? "Picks tailored to your past trips, wishlist, and browsing history."
              : "Sign in and add destinations to your wishlist or book a trip to unlock personalized picks. For now, here are our top recommendations."}
          </p>
        </motion.div>

        {!hasPersonalData && !loading && (
          <div className={`mb-8 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
            darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
          }`}>
            <span className="text-2xl">✨</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Get smarter picks</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Save a few destinations to your wishlist or book a trip — we'll learn what you love.</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/destinations"
                className="text-xs font-semibold px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 no-underline hover:bg-slate-100 dark:hover:bg-white/5"
              >
                Browse tours
              </Link>
              {!token && (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-xs font-semibold text-white px-4 py-2 rounded-full border-none cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #31487A 0%, #4B6DA8 100%)" }}
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        )}

        {/* Type filter */}
        {types.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveType("")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                !activeType
                  ? "border-[#31487A] bg-[#31487A]/10 text-[#31487A]"
                  : darkMode
                  ? "border-white/10 bg-white/5 text-slate-300 hover:border-[#31487A]/40"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[#31487A]/40"
              }`}
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveType(activeType === t ? "" : t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors capitalize ${
                  activeType === t
                    ? "border-[#31487A] bg-[#31487A]/10 text-[#31487A]"
                    : darkMode
                    ? "border-white/10 bg-white/5 text-slate-300 hover:border-[#31487A]/40"
                    : "border-slate-200 bg-white text-slate-600 hover:border-[#31487A]/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        <Section
          title={hasPersonalData ? "Recommended for you" : "Top picks"}
          subtitle={hasPersonalData ? "Based on your activity" : "Highly rated by travellers"}
          darkMode={darkMode}
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : filteredForYou.length === 0 ? (
            <Empty text="No matches for this filter — try another type." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {filteredForYou.map((d) => (
                <DestinationCard
                  key={d.id}
                  destination={d}
                />
              ))}
            </div>
          )}
        </Section>

        {similarToFavourites.length > 0 && (
          <Section
            title="Similar to your favorites"
            subtitle="Because you saved these"
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {similarToFavourites.map((d) => (
                <DestinationCard
                  key={d.id}
                  destination={d}
                />
              ))}
            </div>
          </Section>
        )}

        <Section
          title="Trending now"
          subtitle="Highest-rated destinations this season"
          darkMode={darkMode}
        >
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {trending.slice(0, 6).map((d) => (
                <DestinationCard
                  key={d.id}
                  destination={d}
                />
              ))}
            </div>
          )}
        </Section>

        {byBudget.picks.length > 0 && (
          <Section
            title={`Within your budget (under ${formatINR(byBudget.median)})`}
            subtitle="Smart picks for the price-conscious traveller"
            darkMode={darkMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {byBudget.picks.map((d) => (
                <DestinationCard
                  key={d.id}
                  destination={d}
                />
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, subtitle, darkMode, children }) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Empty({ text }) {
  return (
    <div className={`text-center py-12 text-sm text-slate-500 dark:text-slate-400`}>{text}</div>
  );
}

