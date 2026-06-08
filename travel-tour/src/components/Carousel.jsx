import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const ease = [0.22, 1, 0.36, 1];

export default function Carousel({ items, title, badge }) {
  const [current, setCurrent] = useState(0);
  const [dir, setDir] = useState(1);
  const intervalRef = useRef(null);
  const { user, openAuthModal } = useAuth();
  const addToast = useToast();

  const handleBookClick = (e, id) => {
    if (!user) {
      e.preventDefault();
      openAuthModal("login");
      addToast("info", "Please login to book tours");
    }
  };

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
    <section className="py-16 md:py-24 px-4 md:px-6 bg-slate-50 dark:bg-[#1E2E4F]">
      <div className="max-w-[1200px] mx-auto">
        {badge && (
          <div className="text-center mb-10">
            <span className="inline-block px-5 py-1.5 bg-[#31487A]/10 text-[#31487A] rounded-full text-xs font-bold tracking-wider mb-4 uppercase">
              {badge}
            </span>
            {title && <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white">{title}</h2>}
          </div>
        )}

        <div className="relative">
          {/* Main card */}
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1E2E4F] border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-[#31487A]">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px]">
              {/* Image side */}
              <div className="relative h-[320px] md:h-[420px] lg:h-[480px] overflow-hidden">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent" />

                {/* Rating badge on image */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-lg">
                  <span className="text-amber-500 text-sm">★</span>
                  <span className="text-sm font-bold text-slate-800">{item.rating}</span>
                </div>

                {/* Navigation arrows */}
                {total > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md text-slate-800 flex items-center justify-center text-2xl hover:bg-white hover:scale-105 transition-all cursor-pointer border-none shadow-lg z-10"
                    >
                      ‹
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md text-slate-800 flex items-center justify-center text-2xl hover:bg-white hover:scale-105 transition-all cursor-pointer border-none shadow-lg z-10"
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
                        className={`h-2.5 rounded-full transition-all cursor-pointer border-none ${
                          i === current ? "w-8 bg-white shadow-lg" : "w-2.5 bg-white/40 hover:bg-white/70"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Content side */}
              <div className="p-6 md:p-8 lg:p-10 flex flex-col justify-center bg-gradient-to-br from-white to-slate-50 dark:from-[#1E2E4F] dark:to-[#0a1425]">
                <AnimatePresence initial={false} mode="wait">
                  <motion.div
                    key={current}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-[#31487A]/10 text-[#31487A] capitalize">
                        {item.type}
                      </span>
                      <span className="text-sm text-amber-500 font-medium">★ {item.rating}</span>
                    </div>

                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 dark:text-white mb-3 leading-tight">
                      {item.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                      <span>{item.location}</span>
                      <span className="mx-2">•</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                      </svg>
                      <span>{item.duration}</span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 line-clamp-3">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-200 dark:border-white/10">
                      <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wide block mb-0.5">From</span>
                        <span className="text-3xl font-extrabold bg-gradient-to-r from-[#31487A] to-[#31487A] bg-clip-text text-transparent">₹{item.price.toLocaleString()}</span>
                      </div>
                      <div className="h-10 w-px bg-slate-200 dark:bg-white/10" />
                      <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wide block mb-0.5">Per person</span>
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Includes taxes & fees</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        to={`/tour/${item.id}`}
                        className="flex-1 bg-gradient-to-r from-[#31487A] to-[#31487A] text-white px-6 py-3.5 rounded-xl text-sm font-semibold no-underline hover:shadow-xl hover:shadow-[#31487A]/30 transition-all text-center"
                      >
                        View Details
                      </Link>
                      {user ? (
                        <Link
                          to={`/book/${item.id}`}
                          className="flex-1 border-2 border-[#31487A] text-[#31487A] px-6 py-3.5 rounded-xl text-sm font-semibold no-underline hover:bg-[#31487A] hover:text-white transition-all text-center"
                        >
                          Book Now
                        </Link>
                      ) : (
                        <button
                          onClick={(e) => handleBookClick(e, item.id)}
                          className="flex-1 border-2 border-[#31487A] text-[#31487A] px-6 py-3.5 rounded-xl text-sm font-semibold no-underline hover:bg-[#31487A] hover:text-white transition-all text-center cursor-pointer"
                        >
                          Book Now
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Thumbnails */}
          {total > 1 && (
            <div className="flex gap-3 mt-6 justify-center flex-wrap">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => goTo(i)}
                  className={`relative shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${
                    i === current ? "border-[#31487A] shadow-lg shadow-[#31487A]/20" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={it.image} alt="" className="w-24 h-16 md:w-28 md:h-20 object-cover block" loading="lazy" />
                  {i === current && (
                    <div className="absolute inset-0 bg-[#31487A]/10" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
