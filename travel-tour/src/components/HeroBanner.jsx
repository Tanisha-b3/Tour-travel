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
  { emoji: "🗼", label: "Paris", sub: "France", top: "20%", left: "6%", delay: 1.2 },
  { emoji: "🏯", label: "Kyoto", sub: "Japan",  top: "15%", right: "5%", delay: 1.5 },
  { emoji: "🌊", label: "Bali", sub: "Indonesia", top: "55%", left: "3%", delay: 1.8 },
  { emoji: "🏔️", label: "Swiss Alps", sub: "Switzerland", top: "60%", right: "4%", delay: 2.0 },
];

const ease = [0.22, 1, 0.36, 1];

export default function HeroBanner() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY      = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity  = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <section
      ref={ref}
      className="py-20 relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      {/* ── Parallax background ── */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-105">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2000&q=90')",
            backgroundSize: "cover",
            backgroundPosition: "center 35%",
          }}
        />
        
        {/* Multi-layer blue gradient overlays for depth and harmony with the image */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F2B4D]/60 via-[#1A3A5C]/40 to-[#0A1C2E]/80" />
        
        {/* Atmospheric blue haze at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06203A]/90 via-[#0B2B4A]/50 to-transparent" />
        
        {/* Top vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/40 via-transparent to-transparent" />
        
        {/* Radial glow from center-right where the lake reflection is */}
        <div 
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 55% 45%, transparent 30%, #06203A 100%)",
          }}
        />
        
        {/* Blue light cast overlay to match the sky reflection */}
        <div 
          className="absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            background: "linear-gradient(135deg, #2B5B8B 0%, #1A3A5C 40%, #0F2B4D 100%)",
          }}
        />
        
        {/* Subtle noise grain for texture */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />
      </motion.div>

      {/* ── Floating destination cards ── */}
      {FLOATING_CARDS.map((card, idx) => (
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
            animate={{ y: [0, -10, 0] }}
            transition={{ 
              duration: 5 + (idx * 1.5), 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: idx * 0.5 
            }}
            className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-4 py-3 shadow-2xl hover:bg-white/15 transition-all duration-300"
            style={{
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <span className="text-2xl drop-shadow-lg">{card.emoji}</span>
            <div>
              <p className="text-white font-bold text-sm leading-none tracking-wide drop-shadow-md">{card.label}</p>
              <p className="text-white/70 text-xs mt-0.5 font-medium">{card.sub}</p>
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* ── Main content ── */}
      <motion.div
        style={{ opacity }}
        className="relative z-10 text-center max-w-[1200px] mx-auto px-6 flex flex-col items-center"
      >
        {/* Eyebrow pill with refined blue accent */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="flex items-center gap-2 mb-8"
        >
          <span className="block w-8 h-px bg-gradient-to-r from-transparent to-[#5B8FB9]" />
          <span
            className="text-[#A8CCE8] text-[11px] font-bold tracking-[0.25em] uppercase"
            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "0.25em" }}
          >
            ✈ Airventure Travel Co.
          </span>
          <span className="block w-8 h-px bg-gradient-to-l from-transparent to-[#5B8FB9]" />
        </motion.div>

        {/* Headline with elegant blue gradients */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8, ease }}
          className="text-[clamp(3rem,10vw,7rem)] font-bold text-white leading-[0.95] tracking-tight mb-6 drop-shadow-2xl"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.02em" }}
        >
          Life is Short.{" "}
          <br />
          <span className="relative inline-block">
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #E8F4FF 0%, #8BB8E8 35%, #4A7BA8 70%, #2C5275 100%)",
              }}
            >
              Travel Now.
            </span>
            {/* Underline accent in matching blue tones */}
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.9, duration: 1.1, ease: "easeOut" }}
              className="absolute -bottom-4 left-0 w-full"
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
                  <stop offset="0%" stopColor="#8BB8E8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#4A7BA8" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#2C5275" stopOpacity="1" />
                </linearGradient>
              </defs>
            </motion.svg>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease }}
          className="text-white/85 text-lg md:text-xl leading-relaxed max-w-[540px] mb-12 mt-4 drop-shadow-md"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
        >
          Handcrafted journeys to 50+ countries — curated for those who chase
          horizon lines, not tourist traps.
        </motion.p>

        {/* CTAs with refined blue gradient buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease }}
          className="flex gap-5 justify-center flex-wrap"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {/* Primary Button - Deep Blue Gradient */}
          <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/destinations"
              className="relative overflow-hidden inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold no-underline text-white text-base shadow-2xl transition-all duration-300 group"
              style={{
                background: "linear-gradient(135deg, #1E4A6E 0%, #2C5F82 30%, #3B6E91 100%)",
                boxShadow: "0 12px 40px rgba(0,20,40,0.5), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              <span>Explore Destinations</span>
              <motion.span 
                className="text-lg"
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                →
              </motion.span>
            </Link>
          </motion.div>

          {/* Secondary Button - Frosted Blue */}
          <motion.div whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/tours"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold no-underline text-white text-base backdrop-blur-md transition-all duration-300 group border-2"
              style={{ 
                background: "rgba(30, 74, 110, 0.3)",
                borderColor: "rgba(139, 184, 232, 0.5)",
                backdropFilter: "blur(12px)",
              }}
            >
              <span>View Tours</span>
              <span className="opacity-70 group-hover:opacity-100 transition-opacity">↗</span>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── Stats bar with refined blue styling ── */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.7, ease }}
        className="relative z-10 w-full max-w-[900px] px-6 mt-20"
      >
        <div
          className="rounded-2xl grid grid-cols-2 md:grid-cols-4 overflow-hidden"
          style={{
            background: "rgba(15, 43, 77, 0.45)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(91, 143, 185, 0.3)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + i * 0.1, duration: 0.5, ease }}
              className="relative text-center py-6 px-4 group"
            >
              {/* Hover glow effect */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(59, 110, 145, 0.25) 0%, transparent 70%)",
                }}
              />
              {/* Vertical dividers */}
              {i > 0 && (
                <div className="absolute left-0 top-1/4 h-1/2 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
              )}
              <span className="text-2xl mb-2 block drop-shadow-md">{stat.icon}</span>
              <span
                className="block text-2xl md:text-3xl font-extrabold text-white mb-1 drop-shadow-lg"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.02em" }}
              >
                {stat.num}
              </span>
              <span
                className="text-[10px] text-white/60 uppercase tracking-[0.15em] font-medium"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {stat.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Scroll cue with blue accent ── */}
      <motion.div
        style={{ opacity }}
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span
          className="text-white/50 text-[10px] uppercase tracking-[0.25em] font-medium"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Scroll
        </span>
        <div className="w-[1.5px] h-10 bg-gradient-to-b from-white/50 to-transparent rounded-full" />
      </motion.div>
    </section>
  );
}