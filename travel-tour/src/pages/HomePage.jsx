import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HeroBanner from "../components/HeroBanner";
import MarqueeSlider from "../components/MarqueeSlider";
import DestinationCard from "../components/DestinationCard";
import DestCarousel from "../components/Carousel";
import TestimonialCard from "../components/TestimonialCard";
import SearchSection from "../components/SearchSection";
import CountUp from "../components/CountUp";
import TrustStrip from "../components/TrustStrip";
import { CardSkeleton, TestimonialSkeleton } from "../components/Skeleton";
import { fetchFeatured, fetchPopular, fetchTestimonials, fetchReviewsByDestination } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/* ── animation helpers ── */
const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};
const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
};
function FadeSection({ children, className }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Static data ── */
const WHY_ITEMS = [
  { icon: "🏅", title: "Expert Guides",        desc: "Certified local guides bring destinations to life with insider knowledge and passion." },
  { icon: "💳", title: "Best Price Guarantee", desc: "Find a lower price? We'll match it and give you an extra 10% off." },
  { icon: "🛡️", title: "Safe & Secure",        desc: "Travel with confidence. All packages include comprehensive travel insurance." },
  { icon: "🎯", title: "Tailored Experiences", desc: "Every trip is customised to your preferences, budget, and travel style." },
];

const STATS = [
  { icon: "🌎", num: 50,  suffix: "+", desc: "Countries Covered" },
  { icon: "👤", num: 10000, suffix: "+", desc: "Happy Customers" },
  { icon: "🎉", num: 500, suffix: "+", desc: "Tour Packages" },
  { icon: "⭐", num: 4.9, suffix: "",  desc: "Average Rating", decimals: 1 },
];

function SectionHeader({ badge, title, sub }) {
  return (
    <FadeSection className="text-center mb-12">
      <span className="inline-block px-5 py-1.5 bg-[#31487A]/10 text-[#31487A] rounded-full text-xs font-bold tracking-wider mb-4 uppercase">
        {badge}
      </span>
      <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white mb-3">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-[480px] mx-auto text-sm">{sub}</p>
    </FadeSection>
  );
}

export default function HomePage() {
  const [featured,    setFeatured]    = useState([]);
  const [popularTours,setPopularTours]= useState([]);
  const [testimonials,setTestimonials]= useState([]);
  const [reviewsByDest, setReviewsByDest] = useState({});
  const [loading,     setLoading]     = useState(true);
  const { user, openAuthModal } = useAuth();
  const addToast = useToast();

  const handleViewPackage = (e, id) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("login");
      addToast("info", "Please login to view tour packages");
    }
  };

  useEffect(() => {
    Promise.all([fetchFeatured(), fetchPopular(), fetchTestimonials()])
      .then(async ([f, p, t]) => {
        setFeatured(f); setPopularTours(p); setTestimonials(t);
        const ids = Array.from(new Set([...(f || []).map((d) => d.id), ...(p || []).map((d) => d.id)]));
        if (ids.length) {
          const all = await Promise.all(
            ids.map(async (id) => {
              try {
                const list = await fetchReviewsByDestination(id);
                return { id, list: Array.isArray(list) ? list : [] };
              } catch {
                return { id, list: [] };
              }
            })
          );
          const next = {};
          all.forEach(({ id, list }) => { next[id] = list; });
          setReviewsByDest(next);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      <HeroBanner />

      {/* ── Marquee Slider ── */}
      {/* <MarqueeSlider items={featured} /> */}

      {/* ── Featured Destinations ── */}
      <section className="py-20 px-6 bg-white dark:bg-[#1E2E4F]">
        <div className="max-w-[1200px] mx-auto">
          <SectionHeader
            badge="Featured Destinations"
            title="Popular Destinations"
            sub="Explore our most loved travel destinations, handpicked by our travel experts."
          />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                {featured.map((d, i) => {
                  const reviews = reviewsByDest[d.id] || [];
                  const latest = reviews[0] || null;
                  const avg = reviews.length
                    ? reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length
                    : null;
                  return (
                    <DestinationCard
                      key={d.id}
                      destination={d}
                      index={i}
                      latestReview={latest}
                      reviewCount={reviews.length || (Array.isArray(d.reviews) ? d.reviews.length : 0)}
                      avgRating={avg}
                    />
                  );
                })}
              </div>
              <FadeSection className="text-center mt-12">
                <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Link
                    to="/destinations"
                    className="bg-gradient-to-r from-[#31487A] to-[#31487A] text-white px-10 py-4 rounded-full font-bold no-underline shadow-lg shadow-[#31487A]/30 hover:shadow-xl hover:shadow-[#31487A]/40 transition-shadow"
                  >
                    View All Destinations →
                  </Link>
                </motion.div>
              </FadeSection>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Spotlight Carousel ── */}
      {!loading && featured.length > 0 && (
        <DestCarousel
          items={featured}
          badge="Spotlight"
          title="Destination Spotlight"
        />
      )}

      {/* ── Search ── */}
      <SearchSection />

      {/* ── Trust Strip ── */}
      <TrustStrip />

      {/* ── Popular Tour Packages ── */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-[#1E2E4F]">
        <div className="max-w-[1200px] mx-auto">
          <SectionHeader
            badge="Popular Tours"
            title="Best Selling Packages"
            sub="Handcrafted tour packages that deliver unforgettable experiences and incredible value."
          />

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {popularTours.map((dest, idx) => (
                <motion.article
                  key={dest.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  whileHover={{ y: -8, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                  className="bg-white dark:bg-[#1E2E4F] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(49,72,122,0.07)] hover:shadow-[0_16px_32px_rgba(49,72,122,0.16)] dark:shadow-[0_4px_16px_rgba(49,72,122,0.05)] transition-shadow group"
                >
                  <div className="relative h-[230px] overflow-hidden">
                    <motion.img
                      src={dest.image} alt={dest.name} loading="lazy"
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.08 }}
                      transition={{ duration: 0.5 }}
                    />
                    {idx === 0 && (
                      <span className="absolute top-3 left-3 bg-[#31487A] text-white text-xs font-bold px-3 py-1 rounded-full shadow z-10">
                        🔥 Best Seller
                      </span>
                    )}
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-[#31487A] to-[#31487A] text-white px-4 py-2 rounded-full font-extrabold text-base shadow-lg z-10">
                      ₹{dest.price.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{dest.name}</h3>
                    <div className="flex gap-4 mb-3 text-sm text-slate-400">
                      <span>📅 {dest.duration}</span>
                      <span>⭐ {dest.rating}</span>
                      <span>📍 {dest.location}</span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-5">
                      {dest.description.slice(0, 110)}…
                    </p>
                    <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="inline-block">
                      {user ? (
                        <Link
                          to={`/tour/${dest.id}`}
                          className="inline-flex items-center gap-1 bg-gradient-to-r from-[#31487A] to-[#31487A] text-white px-6 py-2.5 rounded-full text-sm font-semibold no-underline hover:shadow-lg hover:shadow-[#31487A]/35 transition-shadow"
                        >
                          View Package →
                        </Link>
                      ) : (
                        <button
                          onClick={(e) => handleViewPackage(e, dest.id)}
                          className="inline-flex items-center gap-1 bg-gradient-to-r from-[#31487A] to-[#31487A] text-white px-6 py-2.5 rounded-full text-sm font-semibold no-underline hover:shadow-lg hover:shadow-[#31487A]/35 transition-shadow cursor-pointer"
                        >
                          View Package →
                        </button>
                      )}
                    </motion.div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Stats Banner ── */}
      <section
        className="py-16 px-6 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1E2E4F 0%, #31487A 55%, #31487A 100%)" }}
      >
        <div className="absolute inset-0 dot-bg opacity-30 pointer-events-none" />
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(75,109,168,0.35), transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(30,50,89,0.5), transparent 70%)" }}
        />
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <motion.div
              key={s.desc}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, type: "spring", stiffness: 250, damping: 20 }}
            >
              <span className="block text-4xl mb-3">{s.icon}</span>
              <span className="block text-4xl md:text-5xl font-extrabold mb-1">
                <CountUp to={s.num} suffix={s.suffix} decimals={s.decimals || 0} />
              </span>
              <span className="text-sm opacity-80">{s.desc}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="relative py-20 px-6 bg-white dark:bg-[#1E2E4F] overflow-hidden">
        <div className="absolute inset-0 dot-bg opacity-40 pointer-events-none" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(75,109,168,0.10), transparent 70%)" }}
        />
        <div className="relative max-w-[1200px] mx-auto">
          <SectionHeader
            badge="Why Us"
            title="Why Choose Airventure?"
            sub="We go beyond booking — we craft the perfect journey for you."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
            {WHY_ITEMS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
                className="relative bg-slate-50 dark:bg-[#1E2E4F] rounded-2xl p-7 text-center hover:shadow-[0_10px_28px_rgba(49,72,122,0.12)] dark:hover:shadow-[0_10px_28px_rgba(49,72,122,0.2)] transition-shadow border border-slate-100 dark:border-white/5 group"
              >
                <motion.div
                  className="relative w-16 h-16 bg-gradient-to-br from-[#1E3259] via-[#31487A] to-[#4B6DA8] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 shadow-[0_6px_16px_rgba(49,72,122,0.3)]"
                  whileHover={{ scale: 1.15, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <span className="relative z-10">{item.icon}</span>
                  <span className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">{item.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                <span className="absolute top-3 right-3 text-[10px] font-bold text-[#31487A] dark:text-[#7A99CC] opacity-30 group-hover:opacity-100 transition-opacity">
                  0{i + 1}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-[#1E2E4F]">
        <div className="max-w-[1200px] mx-auto">
          <SectionHeader
            badge="Testimonials"
            title="What Our Travelers Say"
            sub="Real experiences from our happy travelers around the world"
          />
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
              {Array.from({ length: 4 }).map((_, i) => <TestimonialSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
              {testimonials.map((t, i) => (
                <TestimonialCard key={t.id} testimonial={t} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section
        className="py-24 px-6 relative overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E2E4F]/90 to-[#31487A]/80" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-[700px] mx-auto text-center text-white"
        >
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
            Ready for Your Next Adventure?
          </h2>
          <p className="opacity-85 mb-10 text-sm md:text-base max-w-[500px] mx-auto">
            Join thousands of happy travelers and start planning your dream trip today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/destinations"
                className="bg-white text-[#31487A] px-9 py-4 rounded-full font-bold no-underline hover:shadow-xl transition-shadow block"
              >
                Start Exploring
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}>
              <Link
                to="/tours"
                className="bg-gradient-to-r from-[#31487A] to-[#31487A] text-white px-9 py-4 rounded-full font-bold no-underline hover:shadow-lg hover:shadow-[#31487A]/40 transition-all block"
              >
                View Packages
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
