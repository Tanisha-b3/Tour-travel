import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/HomePage";
import DestinationsPage from "./pages/DestinationsPage";
import TourDetailPage from "./pages/TourDetailPage";
import BookingPage from "./pages/BookingPage";
import ToursPage from "./pages/ToursPage";
import WishlistPage from "./pages/WishlistPage";
/* Reset scroll on every route change */
function RouteScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

/* Page transition wrapper */
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  enter:   { opacity: 1, y: 0,  transition: { duration: 0.35, ease: "easeOut" } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2,  ease: "easeIn" } },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        <Routes location={location}>
          <Route path="/"             element={<HomePage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/tours"        element={<ToursPage />} />
          <Route path="/tour/:id"     element={<TourDetailPage />} />
          <Route path="/book/:id"     element={<BookingPage />} />
          <Route path="/booking/:id"  element={<BookingPage />} />
          <Route path="/wishlist"     element={<WishlistPage />} />
          {/* 404 */}
          <Route
            path="*"
            element={
                <div className="pt-[70px] min-h-screen flex items-center justify-center px-6 dark:bg-[#050e1a]">
                <div className="text-center">
                  <span className="text-7xl block mb-5">🗺️</span>
                  <h1 className="text-4xl font-extrabold text-slate-800 dark:text-white mb-2">
                    404 — Page Not Found
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 mb-8">
                    The page you're looking for doesn't exist.
                  </p>
                  <a
                    href="/"
                    className="bg-gradient-to-r from-[#0ea5e9] to-[#3b82f6] text-white px-9 py-4 rounded-full font-bold no-underline hover:shadow-lg hover:shadow-[#0ea5e9]/40 transition-shadow inline-block"
                  >
                    Back to Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050e1a] transition-colors duration-300">
        <Navbar />
        <main>
          <RouteScrollReset />
          <AnimatedRoutes />
        </main>
        <Footer />
        <ScrollToTop />
      </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
