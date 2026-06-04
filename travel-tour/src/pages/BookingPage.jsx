import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchDestinationById, createBooking } from "../api";
import { useToast } from "../context/ToastContext";
import Skeleton from "../components/Skeleton";

const TODAY = new Date().toISOString().split("T")[0];
const ease = [0.22, 1, 0.36, 1];

function Field({ label, error, icon, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
        {icon && <span>{icon}</span>}
        {label}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 text-xs">
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BookingPage() {
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    confirmEmail: "",
    phone: "",
    address: "",
    nationality: "",
    checkIn: "",
    checkOut: "",
    guests: 1,
    tripType: "couple",
    specialRequests: ""
  });
  const addToast = useToast();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);
    fetchDestinationById(id).then(setTour).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    validate(name, value);
  };

  const validate = (name, value) => {
    const e = { ...errors };

    switch (name) {
      case "name":
        if (!value.trim()) e.name = "Full name is required";
        else if (value.trim().length < 2) e.name = "Name must be at least 2 characters";
        else if (!/^[a-zA-Z\s'-]+$/.test(value)) e.name = "Name can only contain letters, spaces, hyphens and apostrophes";
        else e.name = "";
        break;

      case "email":
        if (!value.trim()) e.email = "Email is required";
       else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
  e.email = "Enter a valid email address";
}
        else e.email = "";
        break;

      case "confirmEmail":
        if (!value.trim()) e.confirmEmail = "Please confirm your email";
        else if (value !== form.email) e.confirmEmail = "Emails do not match";
        else e.confirmEmail = "";
        break;

      case "phone":
        if (!value.trim()) e.phone = "Phone number is required";
        else if (!/^\+?[\d\s\-()]{7,}$/.test(value)) e.phone = "Enter a valid phone number (min 7 digits)";
        else e.phone = "";
        break;

      case "address":
        if (!value.trim()) e.address = "Address is required";
        else if (value.trim().length < 10) e.address = "Please enter a complete address (min 10 characters)";
        else e.address = "";
        break;

      case "nationality":
        if (!value) e.nationality = "Please select your nationality";
        else e.nationality = "";
        break;

      case "checkIn":
        if (!value) e.checkIn = "Check-in date is required";
        else if (new Date(value) < new Date(TODAY)) e.checkIn = "Check-in date cannot be in the past";
        else e.checkIn = "";
        break;

      case "checkOut":
        if (!value) e.checkOut = "Check-out date is required";
        else if (form.checkIn && new Date(value) <= new Date(form.checkIn)) e.checkOut = "Check-out must be after check-in";
        else if (form.checkIn) {
          const nights = Math.round((new Date(value) - new Date(form.checkIn)) / 86400000);
          if (nights > 30) e.checkOut = "Booking cannot exceed 30 nights";
          else e.checkOut = "";
        } else e.checkOut = "";
        break;

      case "guests":
        if (Number(value) < 1) e.guests = "At least 1 guest required";
        else if (Number(value) > 20) e.guests = "Maximum 20 guests allowed";
        else e.guests = "";
        break;

      default:
        break;
    }

    setErrors(e);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasErrors = Object.values(errors).some(Boolean) || Object.values(form).some((v, i) => {
      const fields = ["name", "email", "confirmEmail", "phone", "address", "nationality", "checkIn", "checkOut", "guests"];
      const key = fields[i];
      if (!key) return false;
      if (key === "name" && !form.name.trim()) return true;
      if (key === "email" && !form.email.trim()) return true;
      if (key === "confirmEmail" && !form.confirmEmail.trim()) return true;
      if (key === "phone" && !form.phone.trim()) return true;
      if (key === "address" && !form.address.trim()) return true;
      if (key === "nationality" && !form.nationality) return true;
      if (key === "checkIn" && !form.checkIn) return true;
      if (key === "checkOut" && !form.checkOut) return true;
      if (key === "guests" && Number(form.guests) < 1) return true;
      return false;
    });
    if (hasErrors) {
      addToast("error", "Please fill in all required fields correctly.");
      return;
    }
    setSubmitting(true); setSubmitError(null);
    try {
      await createBooking({
        tourId: Number(id), tourName: tour.name, name: form.name, email: form.email,
        phone: form.phone, address: form.address, nationality: form.nationality,
        checkIn: form.checkIn, checkOut: form.checkOut, guests: Number(form.guests),
        tripType: form.tripType, specialRequests: form.specialRequests, total,
      });
      setSubmitted(true);
      addToast("success", "Booking confirmed! Check your email for details.");
    } catch (err) {
      setSubmitError(err.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="pt-[70px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d]">
      <div className="max-w-[1200px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-8">
        <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        <Skeleton className="h-[450px]" />
      </div>
    </div>
  );

  if (error || !tour) return (
    <div className="pt-[70px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d] flex items-center justify-center">
      <div className="text-center px-6">
        <div className="w-24 h-24 bg-gradient-to-br from-[#38bdf8]/20 to-[#60a5fa]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">😕</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Tour Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">{error || "Tour not found."}</p>
        <Link to="/destinations" className="bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white px-8 py-3.5 rounded-full font-semibold no-underline inline-block hover:-translate-y-0.5 transition-all">
          Browse Tours
        </Link>
      </div>
    </div>
  );

  const nights = form.checkIn && form.checkOut
    ? Math.max(1, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000))
    : 1;
  const subtotal = tour.price * Number(form.guests) * nights;
  const taxes = Math.round(subtotal * 0.1);
  const total = subtotal + taxes;

  if (submitted) return (
    <div className="pt-[70px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="bg-white dark:bg-[#0c1a2e] rounded-3xl p-8 md:p-12 text-center max-w-[520px] w-full shadow-[0_8px_40px_rgba(14,165,233,0.12)] border border-slate-100 dark:border-white/5"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
          className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-xl shadow-emerald-400/30"
        >
          ✓
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, ease }}
          className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2"
        >
          Booking Confirmed!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, ease }}
          className="text-slate-500 dark:text-slate-400 text-sm mb-8"
        >
          Thank you, <strong className="text-slate-800 dark:text-white">{form.name}</strong>!<br />
          Your trip to <strong className="text-slate-800 dark:text-white">{tour.name}</strong> is all set.
          A confirmation has been sent to <strong className="text-[#38bdf8]">{form.email}</strong>.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, ease }}
          className="bg-[#f8f6f1] dark:bg-[#091422] rounded-2xl p-6 mb-8 text-left divide-y divide-slate-200/60 dark:divide-white/8"
        >
          {[
            { l: "Tour Package", v: tour.name },
            { l: "Check-in",     v: form.checkIn },
            { l: "Check-out",    v: form.checkOut },
            { l: "Guests",       v: form.guests },
            { l: "Duration",     v: `${nights} night${nights > 1 ? "s" : ""}` },
            { l: "Total Paid",   v: `$${total.toLocaleString()}` },
          ].map((item) => (
            <div key={item.l} className="flex justify-between py-3 text-sm">
              <span className="text-slate-400 dark:text-slate-500">{item.l}</span>
              <span className="text-slate-800 dark:text-white font-semibold">{item.v}</span>
            </div>
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, ease }}
          className="flex gap-3 justify-center flex-wrap"
        >
          <Link to="/" className="bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white px-8 py-3.5 rounded-full font-semibold no-underline hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#38bdf8]/35 transition-all">
            Back to Home
          </Link>
          <Link to="/destinations" className="border-2 border-[#38bdf8] text-[#38bdf8] px-8 py-3.5 rounded-full font-semibold no-underline hover:bg-[#38bdf8] hover:text-white transition-all">
            Explore More
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );

  const inputCls = (f) =>
    `py-3 px-4 border-2 rounded-xl text-sm outline-none transition-all duration-200 w-full ${
      errors[f] ? "border-red-400 bg-red-50 dark:bg-red-950" : "border-slate-200 dark:border-slate-600 focus:border-[#38bdf8] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)] bg-white dark:bg-[#0c1a2e] dark:text-slate-200"
    }`;

  return (
    <div className="pt-[70px] min-h-screen bg-[#f8f6f1] dark:bg-[#05101d]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Hero ── */}
      <div className="relative h-[240px] flex items-center justify-center overflow-hidden"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1600&q=80')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0c1a2e]/80 via-[#0c1a2e]/50 to-[#38bdf8]/30" />
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 60%, transparent 30%, #0c1a2e 100%)" }} />
        <div className="relative z-10 text-center text-white px-6">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="text-3xl md:text-4xl font-extrabold mb-2"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Book Your Tour
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
            className="text-white/80 text-base"
          >
            {tour.name}
          </motion.p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center gap-2 text-sm mb-8 text-slate-400"
        >
          <Link to="/" className="text-[#38bdf8] hover:underline">Home</Link> <span>/</span>
          <Link to="/destinations" className="text-[#38bdf8] hover:underline">Destinations</Link> <span>/</span>
          <Link to={`/tour/${id}`} className="text-[#38bdf8] hover:underline">{tour.name}</Link> <span>/</span>
          <span className="text-slate-600 dark:text-slate-400">Book</span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-8 items-start">
          {/* ── FORM ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease }}
          >
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-7">Traveller Details</h2>
            <form onSubmit={handleSubmit} noValidate
              className="bg-white dark:bg-[#0c1a2e] rounded-3xl p-6 md:p-9 shadow-[0_8px_40px_rgba(14,165,233,0.08)] border border-slate-100 dark:border-white/5 space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Full Name *" error={errors.name} icon="👤">
                  <input type="text" name="name" value={form.name} onChange={handleChange}
                    placeholder="John Doe" autoComplete="name" className={inputCls("name")} />
                </Field>
                <Field label="Email Address *" error={errors.email} icon="📧">
                  <input type="email" name="email" value={form.email} onChange={handleChange}
                    placeholder="john@example.com" autoComplete="email" className={inputCls("email")} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Confirm Email *" error={errors.confirmEmail} icon="📧">
                  <input type="email" name="confirmEmail" value={form.confirmEmail} onChange={handleChange}
                    placeholder="john@example.com" autoComplete="email" className={inputCls("confirmEmail")} />
                </Field>
                <Field label="Phone Number *" error={errors.phone} icon="📞">
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="+1 234 567 8900" autoComplete="tel" className={inputCls("phone")} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Address *" error={errors.address} icon="🏠">
                  <input type="text" name="address" value={form.address} onChange={handleChange}
                    placeholder="123 Main Street, City, Country" autoComplete="street-address" className={inputCls("address")} />
                </Field>
                <Field label="Nationality *" error={errors.nationality} icon="🌍">
                  <select name="nationality" value={form.nationality} onChange={handleChange}
                    className={`${inputCls("nationality")} cursor-pointer`}>
                    <option value="">Select nationality</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                    <option value="IT">Italy</option>
                    <option value="ES">Spain</option>
                    <option value="JP">Japan</option>
                    <option value="CN">China</option>
                    <option value="IN">India</option>
                    <option value="BR">Brazil</option>
                    <option value="MX">Mexico</option>
                    <option value="ZA">South Africa</option>
                    <option value="OTHER">Other</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Number of Guests *" error={errors.guests} icon="👥">
                  <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-colors ${errors.guests ? "border-red-400" : "border-slate-200 dark:border-slate-600 focus-within:border-[#38bdf8] focus-within:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"}`}>
                    <button type="button" aria-label="Decrease"
                      onClick={() => { setForm((p) => ({ ...p, guests: Math.max(1, Number(p.guests) - 1) })); validate("guests", String(Math.max(1, Number(form.guests) - 1))); }}
                      className="w-11 h-[46px] bg-slate-50 dark:bg-white/5 text-xl font-bold text-[#38bdf8] hover:bg-[#38bdf8]/10 transition-colors cursor-pointer border-none flex items-center justify-center shrink-0">−</button>
                    <input type="number" name="guests" value={form.guests} onChange={handleChange}
                      min={1} max={20} aria-label="Guests"
                      className="flex-1 py-3 text-center text-sm font-semibold outline-none border-none bg-white dark:bg-[#0c1a2e] dark:text-slate-200" />
                    <button type="button" aria-label="Increase"
                      onClick={() => { setForm((p) => ({ ...p, guests: Math.min(20, Number(p.guests) + 1) })); validate("guests", String(Math.min(20, Number(form.guests) + 1))); }}
                      className="w-11 h-[46px] bg-slate-50 dark:bg-white/5 text-xl font-bold text-[#38bdf8] hover:bg-[#38bdf8]/10 transition-colors cursor-pointer border-none flex items-center justify-center shrink-0">+</button>
                  </div>
                </Field>
                <Field label="Trip Type" icon="✈️">
                  <select name="tripType" value={form.tripType} onChange={handleChange}
                    className={`${inputCls("tripType")} cursor-pointer`}>
                    <option value="couple">Couple's Trip</option>
                    <option value="family">Family Vacation</option>
                    <option value="friends">Friends Group</option>
                    <option value="solo">Solo Adventure</option>
                    <option value="business">Business Trip</option>
                    <option value="honeymoon">Honeymoon</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Check-in Date *" error={errors.checkIn} icon="📅">
                  <input type="date" name="checkIn" value={form.checkIn} onChange={handleChange}
                    min={TODAY} className={inputCls("checkIn")} />
                </Field>
                <Field label="Check-out Date *" error={errors.checkOut} icon="📅">
                  <input type="date" name="checkOut" value={form.checkOut} onChange={handleChange}
                    min={form.checkIn || TODAY} className={inputCls("checkOut")} />
                </Field>
              </div>

              <Field label="Special Requests (Optional)" icon="✏️">
                <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange}
                  placeholder="Dietary requirements, accessibility needs, special occasions..."
                  rows={4} className="py-3 px-4 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:border-[#38bdf8] focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)] transition-all duration-200 resize-none bg-white dark:bg-[#0c1a2e] dark:text-slate-200 w-full" />
              </Field>

              <div className="flex flex-wrap gap-4 text-xs text-slate-400 pt-2">
                <span className="flex items-center gap-1">🔒 SSL Secured Payment</span>
                <span className="flex items-center gap-1">✅ No Hidden Fees</span>
                <span className="flex items-center gap-1">🔄 Free Cancellation (48h)</span>
              </div>

              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm p-4 rounded-xl"
                  >
                    {submitError}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={submitting ? {} : { y: -2 }}
                whileTap={submitting ? {} : { scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white rounded-2xl font-bold text-base cursor-pointer hover:shadow-xl hover:shadow-[#38bdf8]/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-in-out pointer-events-none" />
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="inline-block">⏳</motion.span>
                    Processing...
                  </span>
                ) : (
                  `Confirm Booking — $${total.toLocaleString()}`
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* ── SUMMARY ── */}
          <motion.aside
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease }}
            className="lg:sticky lg:top-[90px] self-start"
          >
            <div className="bg-white dark:bg-[#0c1a2e] rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(14,165,233,0.08)] border border-slate-100 dark:border-white/5">
              <div className="h-2 bg-gradient-to-r from-[#38bdf8] via-[#38bdf8] to-[#60a5fa]" />
              <div className="p-7">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white mb-5 pb-4 border-b border-slate-100 dark:border-white/10">Booking Summary</h3>
                <div className="flex gap-4 mb-6">
                  <img src={tour.image} alt={tour.name} className="w-20 h-16 rounded-xl object-cover shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-1 leading-tight">{tour.name}</h4>
                    <span className="text-xs text-slate-400 block">📅 {tour.duration}</span>
                    <span className="text-xs text-slate-400 block">📍 {tour.location}</span>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5 text-sm">
                  {[
                    { l: "Price per night",              v: `$${tour.price.toLocaleString()}` },
                    { l: `Nights × ${nights}`,           v: `$${(tour.price * nights).toLocaleString()}` },
                    { l: `Guests × ${form.guests}`,      v: `$${subtotal.toLocaleString()}` },
                    { l: "Check-in",                     v: form.checkIn  || "—" },
                    { l: "Check-out",                    v: form.checkOut || "—" },
                    { l: "Taxes & Fees (10%)",           v: `$${taxes.toLocaleString()}` },
                  ].map((item) => (
                    <div key={item.l} className="flex justify-between text-slate-500 dark:text-slate-400">
                      <span>{item.l}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{item.v}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center py-4 border-t-2 border-slate-100 dark:border-white/10 mb-5">
                  <span className="text-base font-extrabold text-slate-800 dark:text-white">Total</span>
                  <motion.span
                    key={total}
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    className="text-2xl font-extrabold bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] bg-clip-text text-transparent"
                  >
                    ${total.toLocaleString()}
                  </motion.span>
                </div>

                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Package Includes</p>
                <ul className="space-y-2 mb-5">
                  {tour.facilities.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                  {tour.facilities.length > 4 && (
                    <li className="text-xs text-slate-400 pl-7">+{tour.facilities.length - 4} more included</li>
                  )}
                </ul>

                <div className="pt-4 border-t border-slate-100 dark:border-white/10 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                  🔒 Secure checkout powered by SSL
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
