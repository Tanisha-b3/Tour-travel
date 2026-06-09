import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchMyBookings, fetchMyTestimonials, cancelMyBooking } from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { CardSkeleton } from "../components/Skeleton";
import ReviewModal from "../components/ReviewModal";
import ConfirmDialog from "../components/ConfirmDialog";

const ease = [0.22, 1, 0.36, 1];

const STATUS_STYLES = {
  confirmed: { label: "Confirmed", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  pending:   { label: "Pending",   cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  cancelled: { label: "Cancelled", cls: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
};

export default function MyBookings() {
  const { token } = useAuth(); // Also get user to check authentication
  const { darkMode } = useTheme();
  const addToast = useToast();
  const [bookings, setBookings] = useState([]);
  const [reviewedIds, setReviewedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    if (!token) {
      console.log("No token found, user not authenticated");
      setLoading(false);
      addToast("warning", "Please login to view your bookings");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [bookingsResponse, testimonialsResponse] = await Promise.all([
        fetchMyBookings(token, { limit: 100 }).catch((err) => {
          console.error("Error fetching bookings:", err);
          return { data: [] };
        }),
        fetchMyTestimonials(token, { limit: 100 }).catch((err) => {
          console.error("Error fetching testimonials:", err);
          return [];
        }),
      ]);

      const bookingsData = bookingsResponse?.data || bookingsResponse || [];
      const testimonialsData = Array.isArray(testimonialsResponse)
        ? testimonialsResponse
        : testimonialsResponse?.data || [];

      setBookings(bookingsData);

      const reviewedBookingIds = new Set(
        testimonialsData
          .map((item) => {
            if (typeof item === "string") return item;
            return String(item.booking?._id || item.booking || item._id || "");
          })
          .filter((id) => id && id !== "undefined")
      );

      setReviewedIds(reviewedBookingIds);
    } catch (err) {
      console.error("Failed to load bookings:", err);
      setError(err.message || "Failed to load bookings");
      addToast("error", err.message || "Failed to load your bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]); // Re-run when token changes

  // Debug: Log bookings when they change
  useEffect(() => {
    console.log("Current bookings state:", bookings);
    console.log("Number of bookings:", bookings.length);
    if (bookings.length > 0) {
      console.log("First booking:", bookings[0]);
    }
  }, [bookings]);

  const handleCancel = async () => {
    if (!cancelling) return;
    setCancelLoading(true);
    try {
      const updated = await cancelMyBooking(cancelling._id, token);
      setBookings((prev) => prev.map((b) => (b._id === cancelling._id ? { ...b, ...(updated || {}), status: updated?.status || "cancelled" } : b)));
      addToast("success", "Booking cancelled.");
    } catch (err) {
      addToast("error", err.message || "Failed to cancel booking");
    } finally {
      setCancelLoading(false);
      setCancelling(null);
    }
  };

  return (
    <div
      className="pt-[88px] min-h-screen bg-[#f8f6f1] dark:bg-[#192338]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[900px] mx-auto px-5 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="mb-8"
        >
          <span className="inline-block px-4 py-1 bg-[#31487A]/10 text-[#31487A] rounded-full text-[11px] font-bold tracking-wider mb-3 uppercase">
            Your Trips
          </span>
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            My Bookings
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            All your reservations in one place.
          </p>
          {!token && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-600 dark:text-amber-400 text-sm">
              Please log in to view your bookings.
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-rose-600 dark:text-rose-400 text-sm">
              Error: {error}
            </div>
          )}
        </motion.div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} className="h-32" />
            ))}
          </div>
        ) : !token ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease }}
            className="text-center py-20"
          >
            <span className="text-6xl block mb-4">🔒</span>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Login Required</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Please login to view your bookings and trip history.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-white px-7 py-3 rounded-full font-semibold no-underline shadow-md hover:shadow-lg transition-shadow"
              style={{ background: "linear-gradient(135deg, #31487A 0%, #31487A 100%)" }}
            >
              Login →
            </Link>
          </motion.div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease }}
            className="text-center py-20"
          >
            <span className="text-6xl block mb-4">✈️</span>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">No trips yet</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Start exploring destinations and book your next adventure.
            </p>
            <Link
              to="/tours"
              className="inline-flex items-center gap-2 text-white px-7 py-3 rounded-full font-semibold no-underline shadow-md hover:shadow-lg hover:shadow-[#31487A]/30 transition-shadow"
              style={{ background: "linear-gradient(135deg, #31487A 0%, #31487A 100%)" }}
            >
              Browse Tours →
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {bookings.map((booking, i) => {
                const statusStyle = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
                const reviewed = reviewedIds.has(String(booking._id));
                const canReview = booking.status !== "cancelled" && !reviewed;

                return (
                  <motion.article
                    key={booking._id || i}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease }}
                    className={`p-5 rounded-2xl border ${
                      darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
                    } shadow-[0_4px_18px_rgba(49,72,122,0.04)]`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className={`text-base font-bold truncate ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}>
                            {booking.tourName || booking.name || "Unknown Tour"}
                          </h3>
                          <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${statusStyle.cls}`}>
                            {statusStyle.label}
                          </span>
                          {reviewed && (
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${
                              darkMode ? "bg-[#31487A]/10 text-[#31487A] border-[#31487A]/20" : "bg-[#31487A]/10 text-[#31487A] border-[#31487A]/30"
                            }`}>
                              ✓ Reviewed
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                          📅 {booking.checkIn || "N/A"} → {booking.checkOut || "N/A"} · 👥 {booking.guests || 1} guest{booking.guests !== 1 ? "s" : ""} · {booking.tripType || "Standard"}
                        </p>
                        {(booking.email || booking.phone) && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 break-words">
                            {booking.email && <>✉️ {booking.email}</>}
                            {booking.email && booking.phone && <> · </>}
                            {booking.phone && <>📞 {booking.phone}</>}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Booked on {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Recently"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {canReview && (
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setReviewing(booking)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white border-none cursor-pointer"
                            style={{ background: "linear-gradient(135deg, #31487A 0%, #31487A 100%)" }}
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M12 2.5l2.95 6.36 6.55.62-4.95 4.55 1.45 6.47L12 17.27l-6 3.23 1.45-6.47L2.5 9.48l6.55-.62L12 2.5z" />
                            </svg>
                            Write Review
                          </motion.button>
                        )}
                        {booking.status !== "cancelled" && (
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setCancelling(booking)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border border-rose-300/60 text-rose-500 dark:border-rose-400/40 dark:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer bg-transparent"
                          >
                            ✕ Cancel
                          </motion.button>
                        )}
                        <div className="text-left sm:text-right">
                          <p className="text-xs uppercase tracking-wider text-slate-400 mb-0.5">Total</p>
                          <p className="text-2xl font-extrabold bg-gradient-to-r from-[#31487A] to-[#31487A] bg-clip-text text-transparent">
                            ₹{(booking.total || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {reviewing && (
        <ReviewModal
          booking={reviewing}
          onClose={() => setReviewing(null)}
          onSuccess={() => setReviewedIds((prev) => new Set([...prev, String(reviewing._id)]))}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(cancelling)}
        onClose={() => (cancelLoading ? null : setCancelling(null))}
        onConfirm={handleCancel}
        title="Cancel this booking?"
        message={cancelling ? `We'll mark “${cancelling.tourName || cancelling.name}” as cancelled${cancelling.paymentStatus === "paid" ? " and queue the refund" : ""}. You can still write a review later.` : ""}
        confirmText="Cancel Booking"
        loading={cancelLoading}
      />
    </div>
  );
}