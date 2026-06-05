import { useParams, Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchDestinationById, createBooking } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import Skeleton from "../components/Skeleton";

const TODAY = new Date().toISOString().split("T")[0];
const ease = [0.22, 1, 0.36, 1];

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh","Belgium",
  "Bhutan","Bolivia","Brazil","Cambodia","Cameroon","Canada","Chile","China","Colombia",
  "Croatia","Cuba","Czech Republic","Denmark","Ecuador","Egypt","Estonia","Ethiopia",
  "Finland","France","Germany","Ghana","Greece","Hungary","Iceland","India","Indonesia",
  "Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya",
  "Kuwait","Laos","Latvia","Lebanon","Lithuania","Luxembourg","Madagascar","Malaysia",
  "Maldives","Mali","Mexico","Mongolia","Morocco","Mozambique","Myanmar","Nepal",
  "Netherlands","New Zealand","Nigeria","North Korea","Norway","Oman","Pakistan","Panama",
  "Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda",
  "Saudi Arabia","Senegal","Serbia","Singapore","Slovakia","Slovenia","Somalia","South Africa",
  "South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tanzania",
  "Thailand","Tunisia","Turkey","UAE","Uganda","Ukraine","United Kingdom","United States",
  "Uruguay","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe",
];

function validateField(name, value, form) {
  switch (name) {
    case "name":
      if (!value.trim()) return "Full name is required";
      if (value.trim().length < 2) return "Name must be at least 2 characters";
      if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Only letters, spaces, hyphens allowed";
      return "";
    case "email":
      if (!value.trim()) return "Email is required";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email";
      return "";
    case "confirmEmail":
      if (!value.trim()) return "Please confirm your email";
      if (value !== form.email) return "Emails do not match";
      return "";
    case "phone":
      if (!value.trim()) return "Phone number is required";
      if (!/^\+?[\d\s\-()]{7,}$/.test(value)) return "Enter a valid phone number";
      return "";
    case "address":
      if (!value.trim()) return "Address is required";
      if (value.trim().length < 5) return "Enter a complete address";
      return "";
    case "nationality":
      if (!value) return "Please select your nationality";
      return "";
    case "checkIn":
      if (!value) return "Check-in date is required";
      if (new Date(value) < new Date(TODAY)) return "Check-in cannot be in the past";
      return "";
    case "checkOut":
      if (!value) return "Check-out date is required";
      if (form.checkIn && new Date(value) <= new Date(form.checkIn)) return "Check-out must be after check-in";
      if (form.checkIn) {
        const nights = Math.round((new Date(value) - new Date(form.checkIn)) / 86400000);
        if (nights > 30) return "Booking cannot exceed 30 nights";
      }
      return "";
    case "guests":
      if (Number(value) < 1) return "At least 1 guest required";
      if (Number(value) > 20) return "Maximum 20 guests allowed";
      return "";
    default:
      return "";
  }
}

function Field({ label, error, icon, children, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
        {icon && <span className="text-sm">{icon}</span>}
        {label}
        {required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-rose-500 text-[11px] flex items-center gap-1"
          >
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = (hasError, darkMode) =>
  `py-3 px-4 border-2 rounded-xl text-sm outline-none transition-all duration-200 w-full ${
    hasError
      ? "border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
      : darkMode
      ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)]"
      : "border-slate-200 bg-slate-50 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#0EA5E9] focus:bg-white focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
  }`;

export default function BookingPage() {
  const { id } = useParams();
  const { darkMode } = useTheme();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const formRef = useRef(null);
  const [form, setForm] = useState({
    name: "", email: "", confirmEmail: "", phone: "",
    address: "", nationality: "", checkIn: "", checkOut: "",
    guests: 1, tripType: "couple", specialRequests: "",
  });
  const addToast = useToast();
  const { token, user } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);
    fetchDestinationById(id).then(setTour).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user) {
      setForm((p) => ({
        ...p,
        name: p.name || user.name || "",
        email: p.email || user.email || "",
        confirmEmail: p.confirmEmail || user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value, { ...form, [name]: value }) }));
    }
  };

  const handleBlur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, form[name], form) }));
  };

  const scrollToFirstError = (errs) => {
    const fields = ["name","email","confirmEmail","phone","address","nationality","checkIn","checkOut","guests"];
    for (const f of fields) {
      if (errs[f]) {
        const el = formRef.current?.querySelector(`[name="${f}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        break;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const allTouched = {};
    const nextErrors = {};
    ["name","email","confirmEmail","phone","address","nationality","checkIn","checkOut","guests"].forEach((f) => {
      allTouched[f] = true;
      nextErrors[f] = validateField(f, form[f], form);
    });
    setTouched(allTouched);
    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      scrollToFirstError(nextErrors);
      addToast("error", "Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await createBooking({
        tourId: Number(id), tourName: tour.name,
        name: form.name, email: form.email, confirmEmail: form.confirmEmail,
        phone: form.phone, address: form.address, nationality: form.nationality,
        checkIn: form.checkIn, checkOut: form.checkOut,
        guests: Number(form.guests), tripType: form.tripType,
        specialRequests: form.specialRequests, total,
      }, token);
      setSubmitted(true);
      addToast("success", "Booking confirmed!");
    } catch (err) {
      setSubmitError(err.message);
      addToast("error", err.message);
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-8">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/50 dark:bg-[#1E2E4F]/50 rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/4 mb-3" />
              <div className="h-10 bg-slate-200 dark:bg-white/10 rounded-xl" />
            </div>
          ))}
        </div>
        <div className="bg-white/50 dark:bg-[#1E2E4F]/50 rounded-2xl p-6 animate-pulse">
          <div className="h-32 bg-slate-200 dark:bg-white/10 rounded-xl mb-4" />
          <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4 mb-2" />
          <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
        </div>
      </div>
    </div>
  );

  if (error || !tour) return (
    <div className="pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#0EA5E9]/20 to-[#3B82F6]/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <span className="text-4xl sm:text-5xl">😕</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">Tour Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 sm:mb-8 text-sm">{error || "The tour you're looking for doesn't exist."}</p>
        <Link to="/destinations" className="inline-block bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold no-underline hover:-translate-y-0.5 transition-all shadow-md hover:shadow-xl text-sm sm:text-base">
          Browse Tours
        </Link>
      </motion.div>
    </div>
  );

  const nights = form.checkIn && form.checkOut
    ? Math.max(1, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000)) : 1;
  const subtotal = tour.price * Number(form.guests) * nights;
  const taxes = Math.round(subtotal * 0.1);
  const total = subtotal + taxes;

  if (submitted) return (
    <div className="pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c] flex items-center justify-center px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="bg-white dark:bg-[#1E2E4F] rounded-3xl p-6 sm:p-8 md:p-12 text-center max-w-[520px] w-full shadow-2xl border border-slate-100 dark:border-white/5"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl mx-auto mb-5 sm:mb-6 shadow-xl shadow-emerald-400/30"
        >
          ✓
        </motion.div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Booking Confirmed!</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 sm:mb-8">
          Thank you, <strong className="text-slate-800 dark:text-white">{form.name}</strong>!<br />
          Your adventure to <strong className="text-[#0EA5E9]">{tour.name}</strong> is all set.
        </p>
        <div className="bg-gradient-to-br from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c] rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 text-left divide-y divide-slate-200/60 dark:divide-white/8">
          {[
            { l: "Tour Package", v: tour.name, icon: "🏝️" },
            { l: "Check-in", v: form.checkIn, icon: "📅" },
            { l: "Check-out", v: form.checkOut, icon: "📅" },
            { l: "Guests", v: `${form.guests} guest${form.guests > 1 ? "s" : ""}`, icon: "👥" },
            { l: "Duration", v: `${nights} night${nights > 1 ? "s" : ""}`, icon: "⏰" },
            { l: "Total Paid", v: `$${total.toLocaleString()}`, icon: "💰" },
          ].map((item) => (
            <div key={item.l} className="flex justify-between py-2.5 sm:py-3 text-sm">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>{item.icon}</span> {item.l}
              </span>
              <span className="text-slate-800 dark:text-white font-semibold">{item.v}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/" className="bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold no-underline hover:-translate-y-0.5 hover:shadow-lg transition-all text-sm">
            Back to Home
          </Link>
          <Link to="/destinations" className="border-2 border-[#0EA5E9] text-[#0EA5E9] px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold no-underline hover:bg-[#0EA5E9] hover:text-white transition-all text-sm">
            Explore More
          </Link>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Enhanced Hero Banner */}
      <div className="relative h-[240px] sm:h-[280px] md:h-[320px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={tour.image} alt={tour.name} className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/90 via-[#0f172a]/70 to-[#0f172a]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center text-white px-4 sm:px-6">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Secure Your Adventure
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
            className="text-white/80 text-base sm:text-lg"
          >
            {tour.name}
          </motion.p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Enhanced Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-8 flex-wrap"
        >
          <Link to="/" className="text-[#0EA5E9] hover:underline">Home</Link>
          <span className="text-slate-400">/</span>
          <Link to="/destinations" className="text-[#0EA5E9] hover:underline">Destinations</Link>
          <span className="text-slate-400">/</span>
          <Link to={`/tour/${id}`} className="text-[#0EA5E9] hover:underline truncate max-w-[150px]">{tour.name}</Link>
          <span className="text-slate-400">/</span>
          <span className="text-slate-600 dark:text-slate-300 font-semibold">Book Now</span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-10 items-start">
          {/* FORM SECTION */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease }}
          >
            <div className="bg-white dark:bg-[#1E2E4F] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] flex items-center justify-center text-white font-bold">1</div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white">Traveller Details</h2>
              </div>
              
              <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Name + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Full Name" required error={touched.name && errors.name} icon="👤">
                    <input type="text" name="name" value={form.name} onChange={handleChange} onBlur={() => handleBlur("name")}
                      placeholder="John Doe" autoComplete="name" className={inputCls(touched.name && errors.name, darkMode)} />
                  </Field>
                  <Field label="Email Address" required error={touched.email && errors.email} icon="📧">
                    <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={() => handleBlur("email")}
                      placeholder="john@example.com" autoComplete="email" className={inputCls(touched.email && errors.email, darkMode)} />
                  </Field>
                </div>

                {/* Confirm Email + Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Confirm Email" required error={touched.confirmEmail && errors.confirmEmail} icon="✓">
                    <input type="email" name="confirmEmail" value={form.confirmEmail} onChange={handleChange} onBlur={() => handleBlur("confirmEmail")}
                      placeholder="john@example.com" autoComplete="email" className={inputCls(touched.confirmEmail && errors.confirmEmail, darkMode)} />
                  </Field>
                  <Field label="Phone Number" required error={touched.phone && errors.phone} icon="📞">
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} onBlur={() => handleBlur("phone")}
                      placeholder="+1 234 567 8900" autoComplete="tel" className={inputCls(touched.phone && errors.phone, darkMode)} />
                  </Field>
                </div>

                {/* Address + Nationality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Address" required error={touched.address && errors.address} icon="🏠">
                    <input type="text" name="address" value={form.address} onChange={handleChange} onBlur={() => handleBlur("address")}
                      placeholder="123 Main Street, City" autoComplete="street-address" className={inputCls(touched.address && errors.address, darkMode)} />
                  </Field>
                  <Field label="Nationality" required error={touched.nationality && errors.nationality} icon="🌍">
                    <select name="nationality" value={form.nationality} onChange={handleChange} onBlur={() => handleBlur("nationality")}
                      className={`${inputCls(touched.nationality && errors.nationality, darkMode)} cursor-pointer`}>
                      <option value="">Select nationality</option>
                      {COUNTRIES.map((c) => <option key={c} value={c} className={darkMode ? "bg-[#1E2E4F]" : ""}>{c}</option>)}
                    </select>
                  </Field>
                </div>

                {/* Guests + Trip Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Number of Guests" required error={touched.guests && errors.guests} icon="👥">
                    <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-colors ${
                      touched.guests && errors.guests ? "border-rose-400" : darkMode ? "border-white/10 focus-within:border-[#0EA5E9]" : "border-slate-200 focus-within:border-[#0EA5E9]"
                    }`}>
                      <button type="button" aria-label="Decrease guests"
                        onClick={() => { const n = Math.max(1, Number(form.guests) - 1); setForm((p) => ({ ...p, guests: n })); setErrors((p) => ({ ...p, guests: validateField("guests", String(n), form) })); }}
                        className={`w-11 h-[46px] text-xl font-bold transition-colors cursor-pointer border-none flex items-center justify-center shrink-0 ${darkMode ? "bg-white/5 text-[#0EA5E9] hover:bg-[#0EA5E9]/20" : "bg-slate-50 text-[#0EA5E9] hover:bg-[#0EA5E9]/10"}`}>−</button>
                      <input type="number" name="guests" value={form.guests} onChange={handleChange}
                        min={1} max={20} aria-label="Guests"
                        className={`flex-1 py-3 text-center text-sm font-semibold outline-none border-none ${darkMode ? "bg-[#1E2E4F] text-white" : "bg-white text-slate-800"}`} />
                      <button type="button" aria-label="Increase guests"
                        onClick={() => { const n = Math.min(20, Number(form.guests) + 1); setForm((p) => ({ ...p, guests: n })); setErrors((p) => ({ ...p, guests: validateField("guests", String(n), form) })); }}
                        className={`w-11 h-[46px] text-xl font-bold transition-colors cursor-pointer border-none flex items-center justify-center shrink-0 ${darkMode ? "bg-white/5 text-[#0EA5E9] hover:bg-[#0EA5E9]/20" : "bg-slate-50 text-[#0EA5E9] hover:bg-[#0EA5E9]/10"}`}>+</button>
                    </div>
                  </Field>
                  <Field label="Trip Type" icon="✈️">
                    <select name="tripType" value={form.tripType} onChange={handleChange}
                      className={`${inputCls(false, darkMode)} cursor-pointer`}>
                      <option value="couple">💑 Couple's Trip</option>
                      <option value="family">👨‍👩‍👧‍👦 Family Vacation</option>
                      <option value="friends">👫 Friends Group</option>
                      <option value="solo">🧘 Solo Adventure</option>
                      <option value="business">💼 Business Trip</option>
                      <option value="honeymoon">🌹 Honeymoon</option>
                      <option value="other">🎒 Other</option>
                    </select>
                  </Field>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Check-in Date" required error={touched.checkIn && errors.checkIn} icon="📅">
                    <input type="date" name="checkIn" value={form.checkIn} onChange={handleChange} onBlur={() => handleBlur("checkIn")}
                      min={TODAY} className={inputCls(touched.checkIn && errors.checkIn, darkMode)} />
                  </Field>
                  <Field label="Check-out Date" required error={touched.checkOut && errors.checkOut} icon="📅">
                    <input type="date" name="checkOut" value={form.checkOut} onChange={handleChange} onBlur={() => handleBlur("checkOut")}
                      min={form.checkIn || TODAY} className={inputCls(touched.checkOut && errors.checkOut, darkMode)} />
                  </Field>
                </div>

                {/* Special Requests */}
                <Field label="Special Requests" icon="✏️">
                  <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange}
                    placeholder="Dietary requirements, accessibility needs, special occasions, or anything else we should know..."
                    rows={3} className={`${inputCls(false, darkMode)} resize-none`} />
                </Field>

                {/* Trust badges */}
                <div className="flex flex-wrap gap-4 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 pt-2 pb-3">
                  <span className="flex items-center gap-1.5">🔒 <span className="font-medium">SSL Secured</span></span>
                  <span className="flex items-center gap-1.5">✅ <span className="font-medium">No Hidden Fees</span></span>
                  <span className="flex items-center gap-1.5">🔄 <span className="font-medium">Free Cancellation (48h)</span></span>
                </div>

                {/* Submit error */}
                <AnimatePresence>
                  {submitError && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm p-4 rounded-xl">
                      ⚠️ {submitError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={submitting ? {} : { y: -3 }}
                  whileTap={submitting ? {} : { scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg cursor-pointer hover:shadow-xl hover:shadow-[#0EA5E9]/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Processing Your Booking...
                    </span>
                  ) : (
                    `Confirm Booking — $${total.toLocaleString()}`
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* SUMMARY SECTION - Enhanced */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease }}
            className="lg:sticky lg:top-[90px] self-start"
          >
            <div className="bg-white dark:bg-[#1E2E4F] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-100 dark:border-white/5">
              <div className="h-2 bg-gradient-to-r from-[#0EA5E9] via-[#3B82F6] to-[#0EA5E9]" />
              <div className="p-6 sm:p-7">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white mb-5 pb-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-2">
                  <span>📋</span> Booking Summary
                </h3>
                
                <div className="flex gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-white/10">
                  <img src={tour.image} alt={tour.name} className="w-20 h-16 rounded-xl object-cover shrink-0 shadow-md" />
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1 leading-tight">{tour.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>📍 {tour.location}</span>
                      <span>•</span>
                      <span>⏱️ {tour.duration}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[#F59E0B]">★</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tour.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Price per person</span>
                    <span className="font-semibold text-slate-800 dark:text-white">${tour.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">× {nights} night{nights > 1 ? "s" : ""}</span>
                    <span className="font-semibold text-slate-800 dark:text-white">${(tour.price * nights).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">× {form.guests} guest{form.guests > 1 ? "s" : ""}</span>
                    <span className="font-semibold text-slate-800 dark:text-white">${subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-100 dark:border-white/10">
                    <span className="text-slate-500 dark:text-slate-400">Taxes & Fees (10%)</span>
                    <span className="font-semibold text-slate-800 dark:text-white">${taxes.toLocaleString()}</span>
                  </div>
                  {form.checkIn && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">📅 Check-in</span>
                      <span className="font-medium text-slate-800 dark:text-white">{form.checkIn}</span>
                    </div>
                  )}
                  {form.checkOut && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">📅 Check-out</span>
                      <span className="font-medium text-slate-800 dark:text-white">{form.checkOut}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center py-4 border-t-2 border-slate-200 dark:border-white/15 mb-6">
                  <span className="text-lg font-extrabold text-slate-800 dark:text-white">Total Amount</span>
                  <motion.span
                    key={total}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] bg-clip-text text-transparent"
                  >
                    ${total.toLocaleString()}
                  </motion.span>
                </div>

                <div className="bg-gradient-to-r from-[#0EA5E9]/5 to-[#3B82F6]/5 dark:from-[#0EA5E9]/10 dark:to-[#3B82F6]/10 rounded-xl p-4 mb-6">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">✨ Package Includes</p>
                  <ul className="space-y-2">
                    {tour.facilities.slice(0, 5).map((f, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
                      >
                        <span className="w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0">✓</span>
                        <span>{f}</span>
                      </motion.li>
                    ))}
                    {tour.facilities.length > 5 && (
                      <li className="text-xs text-slate-400 pl-6">+{tour.facilities.length - 5} more amenities</li>
                    )}
                  </ul>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-3 border-t border-slate-100 dark:border-white/10">
                  <span className="text-sm">🔒</span>
                  <span>Secure checkout powered by SSL encryption</span>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}