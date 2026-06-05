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
import MyBookings from "./pages/MyBookings";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDestinations from "./pages/AdminDestinations";
import AdminDestinationForm from "./pages/AdminDestinationForm";
import AdminTestimonials from "./pages/AdminTestimonials";
import AdminBookings from "./pages/AdminBookings";
import ProtectedRoute from "./components/ProtectedRoute";

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

function NotFound() {
  return (
    <div className="pt-[70px] min-h-screen flex items-center justify-center px-6 bg-white dark:bg-[#1E2E4F]">
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
          className="bg-gradient-to-r from-[#31487A] to-[#31487A] text-white px-9 py-4 rounded-full font-bold no-underline hover:shadow-lg hover:shadow-[#31487A]/40 transition-shadow inline-block"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

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
          <Route path="/book/:id"     element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/booking/:id"  element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/wishlist"     element={<WishlistPage />} />
          <Route path="/my-bookings"  element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />

          {/* Admin section (protected) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index                     element={<AdminDashboard />} />
            <Route path="destinations"       element={<AdminDestinations />} />
            <Route path="destinations/new"   element={<AdminDestinationForm />} />
            <Route path="destinations/:id"   element={<AdminDestinationForm />} />
            <Route path="testimonials"       element={<AdminTestimonials />} />
            <Route path="bookings"           element={<AdminBookings />} />
          </Route>

          <Route path="*" element={isAdmin ? <ProtectedRoute requireAdmin><NotFound /></ProtectedRoute> : <NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#1E2E4F] transition-colors duration-300">
        <RouteScrollReset />
        <AnimatedRoutes />
        <ScrollToTop />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1E2E4F] transition-colors duration-300">
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
