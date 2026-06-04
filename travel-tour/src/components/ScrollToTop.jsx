import { AnimatePresence, motion } from "framer-motion";
import { useScrollTop } from "../hooks/useScrollTop";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/* ─── hook for reduced motion support ─── */
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/* ─── hook for touch device detection ─── */
function useIsTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

/* ─── hook for safe area detection ─── */
function useSafeArea() {
  const [bottomInset, setBottomInset] = useState(24); // 1.5rem in pixels

  useEffect(() => {
    const updateSafeArea = () => {
      // Get safe area inset from CSS env()
      const computedStyle = getComputedStyle(document.documentElement);
      const safeBottom = computedStyle.getPropertyValue('env(safe-area-inset-bottom)');
      if (safeBottom && safeBottom !== '0px') {
        const bottomValue = parseInt(safeBottom, 10);
        if (!isNaN(bottomValue)) {
          setBottomInset(Math.max(24, bottomValue + 12));
          return;
        }
      }
      
      // Fallback for notched devices without env() support
      const isNotched = /iPhone|iPad|iPod/.test(navigator.userAgent) && 
                       window.screen.height >= 812;
      setBottomInset(isNotched ? 40 : 24);
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return bottomInset;
}

/* ─── hook for scroll behavior with smooth fallback ─── */
function useSmoothScroll() {
  const [supportsNativeSmooth, setSupportsNativeSmooth] = useState(true);

  useEffect(() => {
    // Check if smooth scrolling is supported
    const supports = 'scrollBehavior' in document.documentElement.style;
    setSupportsNativeSmooth(supports);
  }, []);

  const scrollToTop = () => {
    if (!supportsNativeSmooth) {
      // Fallback for browsers without smooth scroll support
      const scrollStep = -window.scrollY / (500 / 15);
      const scrollInterval = setInterval(() => {
        if (window.scrollY !== 0) {
          window.scrollBy(0, scrollStep);
        } else {
          clearInterval(scrollInterval);
        }
      }, 15);
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return { scrollToTop, supportsNativeSmooth };
}

export default function ScrollToTop() {
  const { visible, scrollToTop: originalScrollToTop } = useScrollTop(300);
  const prefersReducedMotion = useReducedMotion();
  const isTouch = useIsTouchDevice();
  const safeBottomInset = useSafeArea();
  const { scrollToTop: smoothScrollToTop, supportsNativeSmooth } = useSmoothScroll();

  const location = useLocation();
  const isHome = location.pathname === "/";

  // Custom scroll handler that uses smooth scroll when supported
  const handleScrollToTop = () => {
    if (supportsNativeSmooth && !prefersReducedMotion) {
      smoothScrollToTop();
    } else {
      originalScrollToTop(); // Fallback to instant scroll
    }
  };

  // Don't render on print
  if (typeof window !== 'undefined' && window.matchMedia('print').matches) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-top"
          onClick={handleScrollToTop}
          aria-label="Scroll to top"
          aria-hidden={!visible}
          role="button"
          tabIndex={visible ? 0 : -1}
          initial={!prefersReducedMotion ? { opacity: 0, y: 20, scale: 0.8 } : { opacity: 0 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={!prefersReducedMotion ? { opacity: 0, y: 20, scale: 0.8 } : { opacity: 0 }}
          whileHover={!isTouch && !prefersReducedMotion ? { scale: 1.15, y: -3 } : {}}
          whileTap={!prefersReducedMotion ? { scale: 0.92 } : {}}
          transition={!prefersReducedMotion ? { type: "spring", stiffness: 400, damping: 20 } : { duration: 0 }}
          className={`
            fixed z-50
            w-11 h-11 sm:w-12 sm:h-12
            rounded-full
            bg-gradient-to-br from-[#38bdf8] to-[#60a5fa]
            text-white
            shadow-xl shadow-[#38bdf8]/40
            flex items-center justify-center
            text-lg sm:text-xl font-bold
            cursor-pointer
            transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-[#38bdf8] focus:ring-offset-2 focus:ring-offset-white
            dark:focus:ring-offset-gray-900
            active:scale-95
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:shadow-2xl hover:shadow-[#38bdf8]/50
           
          `}
            style={{
              bottom: '20px',
              right: '20px',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
            }}
        >
          {/* Icon with proper semantics */}
          <span className="sr-only">Scroll to top</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5 sm:w-6 sm:h-6"
            aria-hidden="true"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}