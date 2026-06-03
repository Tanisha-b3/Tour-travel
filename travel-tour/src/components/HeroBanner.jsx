import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const STATS = [
  { num: "50+",  label: "Countries", icon: "🌍" },
  { num: "10K+", label: "Happy Travelers", icon: "🧳" },
  { num: "500+", label: "Tour Packages", icon: "🗺️" },
  { num: "4.9★", label: "Avg. Rating", icon: "✨" },
];

const FLOATING_CARDS = [
  { emoji: "🗼", label: "Paris", sub: "France", top: "22%", left: "6%", delay: 1.2 },
  { emoji: "🏯", label: "Kyoto", sub: "Japan",  top: "18%", right: "7%", delay: 1.5 },
  { emoji: "🌊", label: "Bali", sub: "Indonesia", top: "58%", left: "4%", delay: 1.8 },
];

const ease = [0.22, 1, 0.36, 1];

export default function HeroBanner() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY      = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity  = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="py-25 relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
    >
      {/* ── Parallax background ── */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 scale-110"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1800&q=90')",
            backgroundSize: "cover",
            backgroundPosition: "center 40%",
          }}
        />
        {/* Cinematic colour grade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#06111f]/80 via-[#06111f]/30 to-[#06111f]/85" />
        {/* Warm vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 40%, #06111f 100%)",
          }}
        />
        {/* Subtle noise grain */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />
      </motion.div>

      {/* ── Floating destination cards ── */}
      {FLOATING_CARDS.map((card) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: card.delay, duration: 0.7, ease }}
          style={{
            position: "absolute",
            top: card.top,
            left: card.left,
            right: card.right,
            zIndex: 15,
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
            className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-2xl"
          >
            <span className="text-2xl">{card.emoji}</span>
            <div>
              <p className="text-white font-bold text-sm leading-none tracking-wide">{card.label}</p>
              <p className="text-white/60 text-xs mt-0.5">{card.sub}</p>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* ── Main content ── */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center max-w-[900px] px-6 flex flex-col items-center"
      >
        {/* Eyebrow pill */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="flex items-center gap-2 mb-8"
        >
          <span className="block w-8 h-px bg-gradient-to-r from-transparent to-[#0ea5e9]" />
          <span
            className="text-[#0ea5e9] text-xs font-bold tracking-[0.25em] uppercase"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            ✈ Airventure Travel Co.
          </span>
          <span className="block w-8 h-px bg-gradient-to-l from-transparent to-[#0ea5e9]" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease }}
          className="text-[clamp(3.2rem,10vw,8rem)] font-bold text-white leading-[0.95] tracking-tight mb-6"
          style={{ letterSpacing: "-0.02em" }}
        >
          Life is Short.{" "}
          <br />
          <span className="relative inline-block">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(110deg, #0ea5e9 0%, #3b82f6 40%, #3b82f6 75%, #0ea5e9 100%)",
              }}
            >
              Travel Now.
            </span>
            {/* Underline accent */}
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.9, duration: 1.1, ease: "easeOut" }}
              className="absolute -bottom-3 left-0 w-full"
              viewBox="0 0 320 18"
              fill="none"
            >
              <motion.path
                d="M4 13 C 60 5, 160 18, 316 8"
                stroke="url(#uline)"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="uline" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
              </defs>
            </motion.svg>
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease }}
          className="text-white/70 text-lg md:text-xl leading-relaxed max-w-[540px] mb-12 mt-4"
          style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}
        >
          Handcrafted journeys to 50+ countries — curated for those who chase
          horizon lines, not tourist traps.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease }}
          className="flex gap-4 justify-center flex-wrap"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          {/* Primary */}
          <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/destinations"
              className="relative overflow-hidden inline-flex items-center gap-2 px-9 py-4 rounded-full font-semibold no-underline text-white text-base shadow-2xl btn-glow"
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #3b82f6 100%)",
                boxShadow: "0 8px 40px rgba(14,165,233,0.4)",
              }}
            >
              <span>Explore Destinations</span>
              <span className="text-lg">→</span>
            </Link>
          </motion.div>

          {/* Ghost */}
          <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/tours"
              className="inline-flex items-center gap-2 px-9 py-4 rounded-full font-semibold no-underline text-white text-base border border-white/30 backdrop-blur-md transition-colors"
              style={{ background: "rgba(255,255,255,0.07)" }}
            >
              <span>View Tours</span>
              <span className="opacity-60">↗</span>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Stats bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7, ease }}
        className="relative z-10 w-full max-w-[860px] mx-auto px-6 mt-20"
      >
        <div
          className="rounded-3xl grid grid-cols-2 md:grid-cols-4 overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.13)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.1, duration: 0.5, ease }}
              className="relative text-center py-7 px-4 group"
            >
              {/* Hover glow */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(14,165,233,0.1) 0%, transparent 70%)",
                }}
              />
              {/* Divider */}
              {i > 0 && (
                <div className="absolute left-0 top-1/4 h-1/2 w-px bg-white/15" />
              )}
              <span className="text-2xl mb-2 block">{stat.icon}</span>
              <span
                className="block text-2xl md:text-3xl font-extrabold text-white mb-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}
              >
                {stat.num}
              </span>
              <span
                className="text-xs text-white/50 uppercase tracking-[0.12em]"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Scroll cue ── */}
      <motion.div
        style={{ opacity }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span
          className="text-white/40 text-[10px] uppercase tracking-[0.2em]"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          Scroll
        </span>
        <div className="w-[1px] h-10 bg-gradient-to-b from-white/40 to-transparent" />
      </motion.div>
    </section>
  );
}