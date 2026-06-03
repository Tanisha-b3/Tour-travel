import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

export default function Carousel({ items, title, badge }) {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const intervalRef = useRef(null);

  const total = items.length;

  const goTo = (i) => {
    setDir(i > current ? 1 : -1);
    setCurrent(i);
    resetInterval();
  };

  const next = () => {
    setDir(1);
    setCurrent((p) => (p + 1) % total);
    resetInterval();
  };

  const prev = () => {
    setDir(-1);
    setCurrent((p) => (p - 1 + total) % total);
    resetInterval();
  };

  const resetInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, 5000);
  };

  useEffect(() => {
    if (total <= 1) return;
    intervalRef.current = setInterval(next, 5000);
    return () => clearInterval(intervalRef.current);
  }, [total]);

  if (!items?.length) return null;

  const item = items[current];

  const variants = {
    enter: (d) => ({ x: d > 0 ? 400 : -400, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.5, ease } },
    exit: (d) => ({ x: d > 0 ? -400 : 400, opacity: 0, transition: { duration: 0.4, ease } }),
  };

  return (
    <section className="py-20 px-6 bg-slate-50 dark:bg-[#091422]">
      <div className="max-w-[1200px] mx-auto">
        {badge && (
          <div className="text-center mb-12">
            <span className="inline-block px-5 py-1.5 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-full text-xs font-bold tracking-wider mb-4 uppercase">
              {badge}
            </span>
            {title && <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white">{title}</h2>}
          </div>
        )}

        <div className="relative">
          {/* Main card */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#0c1a2e] border border-slate-100 dark:border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_400px]">
              {/* Image side */}
              <div className="relative h-[280px] md:h-[400px] overflow-hidden">
                <AnimatePresence initial={false} custom={dir} mode="popLayout">
                  <motion.img
                    key={current}
                    src={item.image}
                    alt={item.name}
                    custom={dir}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

                {/* Navigation arrows */}
                {total > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-xl hover:bg-white/40 transition-all cursor-pointer border-none z-10"
                    >
                      ‹
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center text-xl hover:bg-white/40 transition-all cursor-pointer border-none z-10"
                    >
                      ›
                    </button>
                  </>
                )}

                {/* Dots */}
                {total > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                    {items.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goTo(i)}
                        className={`h-2 rounded-full transition-all cursor-pointer border-none ${
                          i === current ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Content side */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#0ea5e9]/10 text-[#0ea5e9] capitalize">
                        {item.type}
                      </span>
                      <span className="text-sm text-amber-500">★ {item.rating}</span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mb-2 leading-tight">
                      {item.name}
                    </h3>

                    <p className="text-sm text-slate-400 mb-1">📍 {item.location}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 line-clamp-3">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-4 mb-6">
                      <div>
                        <span className="text-xs text-slate-400">From</span>
                        <span className="text-2xl font-extrabold text-[#0ea5e9] block">${item.price.toLocaleString()}</span>
                      </div>
                      <span className="text-xs text-slate-400">📅 {item.duration}</span>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        to={`/tour/${item.id}`}
                        className="bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white px-7 py-3 rounded-full text-sm font-semibold no-underline hover:shadow-lg hover:shadow-[#0ea5e9]/35 transition-shadow"
                      >
                        View Details →
                      </Link>
                      <Link
                        to={`/book/${item.id}`}
                        className="border-2 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 px-7 py-3 rounded-full text-sm font-semibold no-underline hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-colors"
                      >
                        Book Now
                      </Link>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          {total > 1 && (
            <div className="flex gap-3 mt-5 justify-center">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => goTo(i)}
                  className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
                    i === current ? "border-[#0ea5e9] opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <img src={it.image} alt="" className="w-16 h-12 object-cover block" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
