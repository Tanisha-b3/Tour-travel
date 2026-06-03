import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import ImageSlider from "../components/ImageSlider";
import Skeleton from "../components/Skeleton";
import { fetchDestinationById } from "../api";
import { useApp } from "../context/AppContext";
import { useToast } from "../context/ToastContext";

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
    <div className="flex flex-col items-center gap-1.5 px-5 py-4 bg-white dark:bg-[#0c1a2e] rounded-2xl shadow-[0_2px_12px_rgba(14,165,233,0.08)] border border-slate-100 dark:border-white/5 hover:border-[#38bdf8]/30 hover:shadow-[0_4px_20px_rgba(14,165,233,0.14)] transition-all group">
      <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">{label}</span>
      <span className="text-sm font-bold text-slate-800 dark:text-white text-center leading-tight">{value}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="pt-[70px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-10 space-y-6 animate-pulse">
        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-full" />
        <div className="h-[460px] bg-slate-200 dark:bg-slate-700 rounded-3xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-2xl" />
          ))}
        </div>
        <div className="h-10 w-3/5 bg-slate-200 dark:bg-slate-700 rounded-xl" />
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
        className="pt-[70px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d] flex items-center justify-center"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center px-6 py-20">
          <div className="w-24 h-24 bg-gradient-to-br from-[#38bdf8]/20 to-[#60a5fa]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">😕</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Tour Not Found</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
            {error || "This tour package doesn't exist."}
          </p>
          <Link
            to="/destinations"
            className="bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white px-8 py-3.5 rounded-full font-semibold no-underline inline-block hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#38bdf8]/40 transition-all"
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
      {/* ── Hero Strip ───────────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-[#0c2340] via-[#0f3460] to-[#0c2340] overflow-hidden">
        {/* decorative orbs */}
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-[#38bdf8]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-24 w-48 h-48 bg-[#60a5fa]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto px-6 py-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-4" aria-label="Breadcrumb">
            <Link to="/" className="text-[#38bdf8] hover:text-white transition-colors">Home</Link>
            <span className="text-slate-600">/</span>
            <Link to="/destinations" className="text-[#38bdf8] hover:text-white transition-colors">Destinations</Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-300 truncate max-w-[220px]">{tour.name}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="capitalize px-3.5 py-1 bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30 rounded-full text-xs font-semibold tracking-wide">
              {tour.type}
            </span>
            <span className="text-slate-400 text-xs">📍 {tour.location}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-xs">⏱ {tour.duration}</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-6 py-8 pb-24">

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-10">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-8">

            {/* Image slider with floating badge */}
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(14,165,233,0.15)]">
                <ImageSlider images={tour.images} />
              </div>
              {/* Floating rating pill */}
              <div className="absolute bottom-4 left-4 bg-white/95 dark:bg-[#0c1a2e]/95 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-white/50 dark:border-white/10">
                <StarRow rating={Math.round(tour.rating)} />
                <span className="text-sm font-bold text-slate-800 dark:text-white">{tour.rating}</span>
                <span className="text-xs text-slate-400">/ 5.0</span>
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBadge icon="📅" label="Duration" value={tour.duration} />
              <StatBadge icon="⭐" label="Rating"   value={`${tour.rating} / 5.0`} />
              <StatBadge icon="📍" label="Location" value={tour.location} />
              <StatBadge icon="🏷️" label="Category" value={tour.type.charAt(0).toUpperCase() + tour.type.slice(1)} />
            </div>

            {/* Title + description */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-4 leading-tight">
                {tour.name}
              </h1>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">{tour.description}</p>
            </div>

            {/* ── Tabs ── */}
            <div>
              {/* Tab bar */}
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-[#0c1a2e] rounded-2xl mb-6 w-fit overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white shadow-md shadow-[#38bdf8]/30"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
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
                      className="flex items-start gap-3 p-4 bg-white dark:bg-[#0c1a2e] rounded-2xl border border-slate-100 dark:border-white/5 hover:border-emerald-300/50 hover:shadow-[0_4px_20px_rgba(16,185,129,0.1)] transition-all group"
                    >
                      <span className="w-7 h-7 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        ✓
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300 leading-snug">{item}</span>
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
                      className="flex items-start gap-3 p-4 bg-white dark:bg-[#0c1a2e] rounded-2xl border border-slate-100 dark:border-white/5 hover:border-sky-300/50 hover:shadow-[0_4px_20px_rgba(14,165,233,0.1)] transition-all group"
                    >
                      <span className="w-7 h-7 bg-gradient-to-br from-[#38bdf8] to-[#60a5fa] rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5 group-hover:scale-110 transition-transform">
                        ✓
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300 leading-snug">{item}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews panel */}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  {/* Aggregate score bar */}
                  <div className="flex items-center gap-5 p-5 bg-white dark:bg-[#0c1a2e] rounded-2xl border border-slate-100 dark:border-white/5 mb-6 flex-wrap">
                    <div className="text-center shrink-0">
                      <span className="text-5xl font-extrabold bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] bg-clip-text text-transparent block leading-none mb-1">
                        {tour.rating}
                      </span>
                      <StarRow rating={Math.round(tour.rating)} />
                      <span className="text-xs text-slate-400 mt-1 block">
                        {tour.reviews.length} review{tour.reviews.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1.5">
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
                      className="bg-white dark:bg-[#0c1a2e] p-6 rounded-2xl border border-slate-100 dark:border-white/5 hover:shadow-[0_4px_20px_rgba(14,165,233,0.08)] transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar placeholder */}
                          <div className="w-10 h-10 bg-gradient-to-br from-[#38bdf8] to-[#60a5fa] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {r.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong className="text-sm text-slate-800 dark:text-white block leading-tight">{r.name}</strong>
                            <StarRow rating={r.rating} />
                          </div>
                        </div>
                        <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full font-semibold border border-emerald-100 dark:border-emerald-800">
                          ✓ Verified
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN — Booking Card ── */}
          <aside className="lg:sticky lg:top-[90px] self-start">
            <div className="bg-white dark:bg-[#0c1a2e] rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(14,165,233,0.12)] dark:border dark:border-white/5">

              {/* Card header gradient band */}
              <div className="h-2 bg-gradient-to-r from-[#38bdf8] via-[#38bdf8] to-[#60a5fa]" />

              <div className="p-7">
                {/* Price */}
                <div className="text-center mb-6 pb-6 border-b border-slate-100 dark:border-white/10">
                  <span className="text-xs text-slate-400 tracking-widest uppercase block mb-1">Starting from</span>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-5xl font-extrabold bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] bg-clip-text text-transparent">
                      ${tour.price.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-sm text-slate-400">per person</span>
                </div>

                {/* Info rows */}
                <div className="space-y-3.5 mb-7">
                  {[
                    { icon: "📅", label: "Duration", value: tour.duration },
                    { icon: "⭐", label: "Rating",   value: `${tour.rating} / 5.0` },
                    { icon: "📍", label: "Location", value: tour.location },
                    { icon: "🏷️", label: "Category", value: tour.type.charAt(0).toUpperCase() + tour.type.slice(1) },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 group">
                      <span className="w-10 h-10 bg-[#38bdf8]/10 dark:bg-[#38bdf8]/5 border border-[#38bdf8]/10 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:bg-[#38bdf8]/15 transition-colors">
                        {item.icon}
                      </span>
                      <div className="flex-1 flex justify-between items-center">
                        <span className="text-xs text-slate-400">{item.label}</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-white">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <Link
                  to={`/book/${tour.id}`}
                  className="block text-center py-4 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white rounded-2xl font-bold text-base no-underline hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#38bdf8]/35 transition-all mb-3 relative overflow-hidden group"
                >
                  {/* shine sweep */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-in-out pointer-events-none" />
                  🛫 Book This Tour
                </Link>

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
                  className={`w-full py-3.5 border-2 rounded-2xl font-semibold text-sm transition-all cursor-pointer mb-5 flex items-center justify-center gap-2 ${
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
                      <span className="text-sm shrink-0 mt-px">{badge.icon}</span>
                      <span className="text-xs text-slate-400 leading-snug">{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Need help card */}
            <div className="mt-4 p-5 bg-gradient-to-br from-[#38bdf8]/10 to-[#60a5fa]/10 dark:from-[#38bdf8]/5 dark:to-[#60a5fa]/5 border border-[#38bdf8]/20 rounded-2xl">
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