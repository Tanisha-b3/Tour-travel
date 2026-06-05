import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SWIPE_THRESHOLD = 50;

export default function ImageSlider({ images, autoPlay = true, interval = 5000 }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loaded, setLoaded] = useState({});

  const goTo = useCallback((index, dir) => {
    setDirection(dir);
    setCurrent(index);
  }, []);

  const prev = useCallback(() => {
    goTo(current === 0 ? images.length - 1 : current - 1, -1);
  }, [current, images.length, goTo]);

  const next = useCallback(() => {
    goTo(current === images.length - 1 ? 0 : current + 1, 1);
  }, [current, images.length, goTo]);

  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    const t = setInterval(next, interval);
    return () => clearInterval(t);
  }, [autoPlay, interval, next, images.length]);

  // Swipe / drag
  const handleDragEnd = (_, info) => {
    if (info.offset.x < -SWIPE_THRESHOLD) next();
    else if (info.offset.x > SWIPE_THRESHOLD) prev();
  };

  if (!images?.length) return null;

  const variants = {
    enter:  (dir) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
    exit:   (dir) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0, transition: { duration: 0.35, ease: "easeIn" } }),
  };

  return (
    <div className="w-full select-none">
      {/* Main frame */}
      <div className="relative rounded-2xl overflow-hidden h-[280px] md:h-[460px] bg-slate-200 dark:bg-slate-800 group cursor-grab active:cursor-grabbing">
        {!loaded[current] && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 animate-pulse z-10" />
        )}
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.img
            key={current}
            src={images[current]}
            alt={`Tour image ${current + 1}`}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            onLoad={() => setLoaded((p) => ({ ...p, [current]: true }))}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${loaded[current] ? "opacity-100" : "opacity-0"}`}
            draggable={false}
          />
        </AnimatePresence>

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none z-10" />

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <motion.button
              onClick={prev}
              aria-label="Previous image"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-1/2 -translate-y-1/2 left-4 z-20 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center text-2xl cursor-pointer hover:bg-[#31487A]/80 transition-colors opacity-0 group-hover:opacity-100"
            >
              ‹
            </motion.button>
            <motion.button
              onClick={next}
              aria-label="Next image"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-1/2 -translate-y-1/2 right-4 z-20 w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center text-2xl cursor-pointer hover:bg-[#31487A]/80 transition-colors opacity-0 group-hover:opacity-100"
            >
              ›
            </motion.button>

            {/* Dot indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {images.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => goTo(i, i > current ? 1 : -1)}
                  aria-label={`Go to image ${i + 1}`}
                  animate={{ width: i === current ? 24 : 8, backgroundColor: i === current ? "#31487A" : "rgba(255,255,255,0.5)" }}
                  transition={{ duration: 0.3 }}
                  className="h-2 rounded-full cursor-pointer"
                />
              ))}
            </div>
          </>
        )}

        {/* Counter */}
        <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
          {current + 1} / {images.length}
        </div>

        {/* Swipe hint — shown briefly on mobile */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-white/50 text-xs pointer-events-none md:hidden">
          ← swipe →
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2.5 mt-3 justify-center">
          {images.map((img, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i, i > current ? 1 : -1)}
              aria-label={`View image ${i + 1}`}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              animate={{ opacity: i === current ? 1 : 0.45, borderColor: i === current ? "#31487A" : "transparent" }}
              transition={{ duration: 0.25 }}
              className="rounded-xl overflow-hidden border-2 cursor-pointer"
            >
              <img
                src={img}
                alt=""
                className="w-[72px] md:w-24 h-[50px] md:h-[64px] object-cover block"
                loading="lazy"
                draggable={false}
              />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
