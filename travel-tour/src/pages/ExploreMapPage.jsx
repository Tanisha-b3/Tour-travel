import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchDestinations, fetchDestinationTypes } from "../api";
import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";
import WorldMap from "../components/WorldMap";
import { lookupCoords, TYPE_DOT_COLOR } from "../utils/coordinates";
import { CardSkeleton } from "../components/Skeleton";

const ease = [0.22, 1, 0.36, 1];

function formatINR(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function ExploreMapPage() {
  const { darkMode } = useTheme();
  const { isWishlisted, toggleWishlist, user } = useApp();
  const [allDestinations, setAllDestinations] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeType, setActiveType] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDestinations({ limit: 100 }),
      fetchDestinationTypes(),
    ])
      .then(([dRes, tRes]) => {
        setAllDestinations(dRes.data || []);
        setTypes(tRes || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const withCoords = useMemo(
    () => allDestinations.map((d) => ({ ...d, coords: lookupCoords(d) })),
    [allDestinations]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return withCoords.filter((d) => {
      if (activeType && d.type !== activeType) return false;
      if (q && ![d.name, d.location, d.region, d.type, d.category]
        .filter(Boolean)
        .some((s) => s.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [withCoords, search, activeType]);

  const mappedCount = useMemo(
    () => withCoords.filter((d) => d.coords).length,
    [withCoords]
  );

  return (
    <div
      className="pt-[88px] min-h-screen bg-[#f8f6f1] dark:bg-[#192338]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="mb-6"
        >
          <span className="inline-block px-4 py-1 bg-[#31487A]/10 text-[#31487A] rounded-full text-[11px] font-bold tracking-wider mb-3 uppercase">
            Interactive World Map
          </span>
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Explore by Map
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl">
            Pan, zoom, and tap any pin to preview a destination. {mappedCount} of {withCoords.length} destinations are mapped.
          </p>
        </motion.div>

        <div className={`mb-4 p-3 sm:p-4 rounded-2xl border flex flex-col sm:flex-row gap-3 ${
          darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
        }`}>
          <div className="relative flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search destinations…"
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none border ${
                darkMode
                  ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#31487A]/60"
                  : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#31487A]/50"
              }`}
              style={{ minHeight: 40 }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setActiveType("")}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${
                !activeType
                  ? "border-[#31487A] bg-[#31487A]/10 text-[#31487A]"
                  : darkMode
                  ? "border-white/10 bg-white/5 text-slate-300"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveType(activeType === t ? "" : t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border capitalize ${
                  activeType === t
                    ? "border-[#31487A] bg-[#31487A]/10 text-[#31487A]"
                    : darkMode
                    ? "border-white/10 bg-white/5 text-slate-300"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: TYPE_DOT_COLOR[t] || "#31487A" }} />
                {t}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 dark:border-white/5 h-[500px] flex items-center justify-center bg-white dark:bg-[#1E2E4F]">
            <CardSkeleton className="h-3/4 w-3/4" />
          </div>
        ) : (
          <WorldMap
            destinations={filtered}
            onSelect={setSelected}
            darkMode={darkMode}
          />
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold">Legend:</span>
          {types.map((t) => (
            <span key={t} className="flex items-center gap-1.5 capitalize">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_DOT_COLOR[t] || "#31487A" }} />
              {t}
            </span>
          ))}
        </div>

        {filtered.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-3">
              {filtered.length} destination{filtered.length === 1 ? "" : "s"} in view
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {filtered.map((d) => (
                <Link
                  key={d.id}
                  to={`/tour/${d.id}`}
                  className={`group block rounded-xl overflow-hidden border transition-shadow ${
                    darkMode ? "bg-[#1E2E4F] border-white/5 hover:shadow-2xl" : "bg-white border-slate-200 hover:shadow-xl"
                  }`}
                >
                  <div className="relative h-28 sm:h-32">
                    <img src={d.image} alt={d.name} loading="lazy" className="w-full h-full object-cover" />
                    <span className="absolute top-2 right-2 bg-[#1E2E4F]/80 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-0.5">
                      <span className="text-amber-400">★</span>{d.rating?.toFixed?.(1) || d.rating}
                    </span>
                    <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_DOT_COLOR[d.type] || "#31487A" }} />
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate">{d.name}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{d.location}</p>
                    <p className="text-xs font-bold text-[#31487A] mt-1">{formatINR(d.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!loading && withCoords.length > 0 && mappedCount === 0 && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm">
            No destination coordinates found yet. Add lat/lng to your destinations in the admin panel to see them on the map.
          </div>
        )}
      </div>
    </div>
  );
}
