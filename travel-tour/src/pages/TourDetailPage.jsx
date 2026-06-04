import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ImageSlider from "../components/ImageSlider";
import Skeleton from "../components/Skeleton";
import { fetchDestinationById } from "../api";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

function StarRow({ rating, max = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`text-base transition-colors ${
            i < rating ? "text-amber-400" : "text-slate-200 dark:text-slate-700"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function StatBadge({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-3 py-3 sm:px-5 sm:py-4 bg-white dark:bg-[#0c1a2e] rounded-2xl shadow-[0_2px_12px_rgba(14,165,233,0.08)] border border-slate-100 dark:border-white/5 hover:border-[#38bdf8]/30 hover:shadow-[0_4px_20px_rgba(14,165,233,0.14)] transition-all group">
      <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">{label}</span>
      <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white text-center leading-tight">{value}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="pt-[70px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-pulse">
        <div className="h-4 w-32 sm:w-48 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-[280px] sm:h-[380px] md:h-[460px] bg-slate-200 dark:bg-slate-700 rounded-2xl sm:rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-slate-200 dark:bg-slate-700 rounded-xl sm:rounded-2xl" />
          ))}
        </div>
        <div className="h-8 sm:h-10 w-4/5 bg-slate-200 dark:bg-slate-700 rounded-xl" />
        <div className="h-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full" />
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
        className="pt-[70px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d] flex items-center justify-center px-4"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center py-12 sm:py-20">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#38bdf8]/20 to-[#60a5fa]/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <span className="text-4xl sm:text-5xl">😕</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">Tour Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6 sm:mb-8 text-sm px-4">
            {error || "This tour package doesn't exist."}
          </p>
          <Link
            to="/destinations"
            className="bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold no-underline inline-block hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#38bdf8]/40 transition-all text-sm sm:text-base"
          >
            Browse Tours
          </Link>
        </div>
      </div>
    );

  const wishlisted = isWishlisted(tour.id);

  const tabs = [
    { id: "highlights", label: "Highlights", icon: "✦" },
    { id: "included",   label: "Included",   icon: "📦" },
    { id: "reviews",    label: "Reviews",    icon: "💬", count: tour.reviews?.length },
  ];

  return (
    <div
      className="pt-[70px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Hero Strip */}
      <div className="relative bg-gradient-to-r from-[#0c2340] via-[#0f3460] to-[#0c2340] overflow-hidden">
        <div className="absolute -top-16 -left-16 w-48 sm:w-64 h-48 sm:h-64 bg-[#38bdf8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-12 sm:right-24 w-36 sm:w-48 h-36 sm:h-48 bg-[#60a5fa]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-slate-400 mb-3 sm:mb-4 flex-wrap" aria-label="Breadcrumb">
            <Link to="/" className="text-[#38bdf8] hover:text-white transition-colors">Home</Link>
            <span className="text-slate-600">/</span>
            <Link to="/destinations" className="text-[#38bdf8] hover:text-white transition-colors">Destinations</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 truncate max-w-[180px] sm:max-w-[220px]">{tour.name}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="capitalize px-3 py-0.5 sm:py-1 bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30 rounded-full text-[11px] sm:text-xs font-semibold tracking-wide">
              {tour.type}
            </span>
            <span className="text-slate-400 text-[11px] sm:text-xs">📍 {tour.location}</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 text-[11px] sm:text-xs">⏱ {tour.duration}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16 sm:pb-24">
        {/* Two-column grid — responsive stacking */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-8 lg:gap-10">
          
          {/* LEFT COLUMN */}
          <div className="space-y-6 sm:space-y-8">
            {/* Image slider with badge */}
            <div className="relative">
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(14,165,233,0.15)]">
                <ImageSlider images={tour.images} />
              </div>
              <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-white/95 dark:bg-[#0c1a2e]/95 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2 border border-white/50 dark:border-white/10">
                <StarRow rating={Math.round(tour.rating)} />
                <span className="text-sm font-bold text-slate-800 dark:text-white">{tour.rating}</span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
            </div>

            {/* Quick stats row — fully responsive grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <StatBadge icon="📅" label="Duration" value={tour.duration} />
              <StatBadge icon="⭐" label="Rating"   value={`${tour.rating} / 5.0`} />
              <StatBadge icon="📍" label="Location" value={tour.location} />
              <StatBadge icon="🏷️" label="Category" value={tour.type.charAt(0).toUpperCase() + tour.type.slice(1)} />
            </div>

            {/* Title + description */}
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-3 sm:mb-4 leading-tight">
                {tour.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm sm:text-base">{tour.description}</p>
            </div>

            {/* Tabs section */}
            <div>
              {/* Tab bar — horizontal scroll on mobile, wrap friendly */}
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-[#0c1a2e] rounded-2xl mb-5 sm:mb-6 overflow-x-auto whitespace-nowrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white shadow-md shadow-[#38bdf8]/30"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <span className="text-sm sm:text-base">{tab.icon}</span>
                    <span className="hidden xs:inline">{tab.label}</span>
                    <span className="xs:hidden">{tab.icon === "✦" ? "✨" : tab.icon === "📦" ? "Box" : "Reviews"}</span>
                    {tab.count != null && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Highlights panel */}
              {activeTab === "highlights" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tour.highlights.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 sm:p-4 bg-white dark:bg-[#0c1a2e] rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-300/50 hover:shadow-[0_4px_20px_rgba(16,185,129,0.1)] transition-all group"
                    >
                      <span className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        ✓
                      </span>
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Included panel */}
              {activeTab === "included" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tour.facilities.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 sm:p-4 bg-white dark:bg-[#0c1a2e] rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/5 hover:border-sky-300/50 hover:shadow-[0_4px_20px_rgba(14,165,233,0.1)] transition-all group"
                    >
                      <span className="w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-[#38bdf8] to-[#60a5fa] rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        ✓
                      </span>
                      <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews panel — fully responsive layout */}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 p-4 sm:p-5 bg-white dark:bg-[#0c1a2e] rounded-2xl border border-slate-100 dark:border-white/5 mb-5 sm:mb-6">
                    <div className="text-center shrink-0 w-full sm:w-auto">
                      <span className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] bg-clip-text text-transparent block leading-none mb-1">
                        {tour.rating}
                      </span>
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
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {tour.reviews.map((r, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-[#0c1a2e] p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-white/5 hover:shadow-[0_4px_20px_rgba(14,165,233,0.08)] transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#38bdf8] to-[#60a5fa] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-sm text-slate-800 dark:text-white block leading-tight">{r.name}</strong>
                            <StarRow rating={r.rating} />
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-semibold border border-emerald-100 dark:border-emerald-800 w-fit">
                          ✓ Verified
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — Booking Card (Sticky on desktop) */}
          <aside className="lg:sticky lg:top-[90px] self-start mt-6 lg:mt-0">
            <div className="bg-white dark:bg-[#0c1a2e] rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(14,165,233,0.12)] dark:border dark:border-white/5">
              <div className="h-2 bg-gradient-to-r from-[#38bdf8] via-[#38bdf8] to-[#60a5fa]" />
              <div className="p-5 sm:p-7">
                {/* Price */}
                <div className="text-center mb-5 pb-5 border-b border-slate-100 dark:border-white/10">
                  <span className="text-[10px] sm:text-xs text-slate-400 tracking-widest uppercase block mb-1">Starting from</span>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] bg-clip-text text-transparent">
                      ${tour.price.toLocaleString()}
                    </span>
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
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 group">
                      <span className="w-8 h-8 sm:w-10 sm:h-10 bg-[#38bdf8]/10 dark:bg-[#38bdf8]/5 border border-[#38bdf8]/10 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0 group-hover:bg-[#38bdf8]/15 transition-colors">
                        {item.icon}
                      </span>
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-[11px] sm:text-xs text-slate-400">{item.label}</span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-white">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                {user ? (
                  <Link
                    to={`/book/${tour.id}`}
                    className="block text-center py-3 sm:py-4 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base no-underline hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#38bdf8]/35 transition-all mb-3 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-in-out pointer-events-none" />
                    🛫 Book This Tour
                  </Link>
                ) : (
                  <button
                    onClick={() => { openAuthModal("login"); addToast("info", "Please login to book this tour"); }}
                    className="w-full text-center py-3 sm:py-4 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base no-underline hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#38bdf8]/35 transition-all mb-3 relative overflow-hidden group cursor-pointer"
                  >
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-in-out pointer-events-none" />
                    🛫 Book This Tour
                  </button>
                )}

                <button
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
                      ? "border-rose-400 text-rose-500 bg-rose-50 dark:bg-rose-950/40"
                      : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-[#38bdf8] hover:text-[#38bdf8] hover:bg-[#38bdf8]/5"
                  }`}
                >
                  {wishlisted ? "❤️ Remove from Wishlist" : "🤍 Save to Wishlist"}
                </button>

                {/* Trust badges */}
                <div className="space-y-2">
                  {[
                    { icon: "🔒", text: "Free cancellation up to 48 hrs before departure" },
                    { icon: "💳", text: "Secure payment — SSL encrypted" },
                    { icon: "🏅", text: "Best price guaranteed" },
                  ].map((badge) => (
                    <div key={badge.text} className="flex items-start gap-2">
                      <span className="text-xs sm:text-sm shrink-0 mt-px">{badge.icon}</span>
                      <span className="text-[10px] sm:text-xs text-slate-400 leading-snug">{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Need help card */}
            <div className="mt-4 p-4 sm:p-5 bg-gradient-to-br from-[#38bdf8]/10 to-[#60a5fa]/10 dark:from-[#38bdf8]/5 dark:to-[#60a5fa]/5 border border-[#38bdf8]/20 rounded-xl sm:rounded-2xl">
              <p className="text-sm font-semibold text-slate-700 dark:text-white mb-1">🎯 Need help choosing?</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Our travel experts are available 24/7 to help you plan the perfect trip.
              </p>
              <button className="mt-3 text-xs font-semibold text-[#38bdf8] hover:underline cursor-pointer bg-transparent border-none p-0">
                Chat with an expert →
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}