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

const DRAFT_KEY = (tourId) => `airventure:booking:draft:${tourId}`;
const RESTORED_FLAG = (tourId) => `airventure:booking:restored:${tourId}`;

const EMPTY_FORM = {
  name: "", email: "", confirmEmail: "", phone: "",
  address: "", nationality: "", checkIn: "", checkOut: "",
  guests: 1, tripType: "couple", specialRequests: "",
};

const EMPTY_CARD = { cardName: "", cardNumber: "", cardExpiry: "", cardCvc: "" };

function loadDraft(tourId) {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY(tourId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return { ...EMPTY_FORM, ...parsed };
  } catch { return null; }
}

function saveDraft(tourId, form) {
  try {
    const safe = { ...form };
    safe.guests = Number(safe.guests) || 1;
    sessionStorage.setItem(DRAFT_KEY(tourId), JSON.stringify(safe));
  } catch { /* noop */ }
}

function clearDraft(tourId) {
  try {
    sessionStorage.removeItem(DRAFT_KEY(tourId));
    sessionStorage.removeItem(RESTORED_FLAG(tourId));
  } catch { /* noop */ }
}

function AutoSaveBadge({ form }) {
  const hasDraft = Object.entries(form).some(([k, v]) => {
    if (k === "guests") return Number(v) !== 1;
    if (k === "tripType") return v !== "couple";
    return Boolean(v);
  });
  if (!hasDraft) return null;
  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="mb-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-fit">
      <motion.span animate={{ scale: [1, 1.35, 1], opacity: [1, 0.6, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
        className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
      <span className="text-[11px] font-semibold tracking-wide">Auto-saved — your data survives a refresh</span>
    </motion.div>
  );
}

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

/* ── Custom searchable dropdown ── */
function SelectDropdown({ options, value, onChange, onBlur, placeholder, searchPlaceholder, error, darkMode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(-1);
  const ref = useRef(null);
  const inputRef = useRef(null);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQuery(""); setHighlight(-1); onBlur?.(); } };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onBlur]);

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 50); }, [open]);
  useEffect(() => { setHighlight(-1); }, [query]);

  const select = (val) => { onChange(val); setOpen(false); setQuery(""); setHighlight(-1); };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (highlight >= 0 && highlight < filtered.length) select(filtered[highlight]); }
    else if (e.key === "Escape") { setOpen(false); setQuery(""); setHighlight(-1); }
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)}
        className={`w-full px-4 py-3 border-2 rounded-xl text-sm outline-none transition-all duration-200 text-left cursor-pointer flex items-center justify-between gap-2 ${
          error ? "border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
          : darkMode ? "border-white/10 bg-white/5 text-white" : "border-slate-200 bg-slate-50 text-[#0a0f1e]"
        }`}>
        <span className={`truncate ${!value ? (darkMode ? "text-slate-500" : "text-slate-400") : ""}`}>{value || placeholder}</span>
        <svg className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${darkMode ? "text-slate-400" : "text-slate-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className={`absolute z-50 mt-1.5 w-full rounded-xl border shadow-2xl overflow-hidden ${darkMode ? "bg-[#1a2744] border-white/10" : "bg-white border-slate-200"}`}>
          <div className={`p-2 border-b ${darkMode ? "border-white/10" : "border-slate-100"}`}>
            <div className="relative">
              <svg className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${darkMode ? "text-slate-500" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} placeholder={searchPlaceholder}
                className={`w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none border ${darkMode ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500" : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"}`} />
            </div>
          </div>
          <ul className="max-h-[200px] overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <li className={`px-4 py-3 text-xs text-center ${darkMode ? "text-slate-500" : "text-slate-400"}`}>No results found</li>
            ) : filtered.map((opt, i) => (
              <li key={opt} onClick={() => select(opt)} onMouseEnter={() => setHighlight(i)}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center gap-2 ${
                  value === opt ? (darkMode ? "bg-[#0EA5E9]/15 text-[#38bdf8]" : "bg-[#0EA5E9]/10 text-[#0284c7] font-semibold")
                  : highlight === i ? (darkMode ? "bg-white/5 text-white" : "bg-slate-50 text-slate-900")
                  : (darkMode ? "text-slate-300 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50")
                }`}>
                {value === opt && <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                <span className="truncate">{opt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ── Validation ── */
function validateField(name, value, form) {
  switch (name) {
    case "name": if (!value.trim()) return "Full name is required"; if (value.trim().length < 2) return "Name must be at least 2 characters"; if (!/^[a-zA-Z\s'-]+$/.test(value)) return "Only letters, spaces, hyphens allowed"; return "";
    case "email": if (!value.trim()) return "Email is required"; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email"; return "";
    case "confirmEmail": if (!value.trim()) return "Please confirm your email"; if (value !== form.email) return "Emails do not match"; return "";
    case "phone": if (!value.trim()) return "Phone number is required"; if (!/^\d{10}$/.test(value.replace(/[\s\-()]/g, ""))) return "Enter exactly 10 digits"; return "";
    case "address": if (!value.trim()) return "Address is required"; if (value.trim().length < 5) return "Enter a complete address"; return "";
    case "nationality": if (!value) return "Please select your nationality"; return "";
    case "checkIn": if (!value) return "Check-in date is required"; if (new Date(value) < new Date(TODAY)) return "Check-in cannot be in the past"; return "";
    case "checkOut": if (!value) return "Check-out date is required"; if (form.checkIn && new Date(value) <= new Date(form.checkIn)) return "Check-out must be after check-in"; if (form.checkIn) { const n = Math.round((new Date(value) - new Date(form.checkIn)) / 86400000); if (n > 30) return "Booking cannot exceed 30 nights"; } return "";
    case "guests": if (Number(value) < 1) return "At least 1 guest required"; if (Number(value) > 20) return "Maximum 20 guests allowed"; return "";
    default: return "";
  }
}

function validateCard(name, value) {
  switch (name) {
    case "cardName": if (!value.trim()) return "Cardholder name is required"; if (value.trim().length < 2) return "Enter a valid name"; return "";
    case "cardNumber": if (!value.trim()) return "Card number is required"; if (value.replace(/\D+/g, "").length < 13) return "Enter a valid card number"; return "";
    case "cardExpiry": if (!value.trim()) return "Expiry is required"; if (!/^\d{2}\s*\/\s*\d{2}$/.test(value.trim())) return "Format must be MM/YY"; return "";
    case "cardCvc": if (!value.trim()) return "Security code is required"; if (!/^\d{3,4}$/.test(value.trim())) return "Enter a valid CVC"; return "";
    default: return "";
  }
}

/* ── Shared UI ── */
function Field({ label, error, icon, children, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
        {icon && <span className="text-sm">{icon}</span>}{label}{required && <span className="text-rose-400">*</span>}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.span initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -4, height: 0 }}
            className="text-rose-500 text-[11px] flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = (hasError, darkMode) =>
  `py-3 px-4 border-2 rounded-xl text-sm outline-none transition-all duration-200 w-full ${
    hasError ? "border-rose-400 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
    : darkMode ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-[#0EA5E9] focus:bg-white/8 focus:shadow-[0_0_0_3px_rgba(14,165,233,0.15)]"
    : "border-slate-200 bg-slate-50 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#0EA5E9] focus:bg-white focus:shadow-[0_0_0_3px_rgba(14,165,233,0.1)]"
  }`;

/* ══════════════════════════════════════════════════════════════
   PAYMENT DIALOG
   ══════════════════════════════════════════════════════════════ */
function PaymentDialog({ open, onClose, onConfirm, tour, form, total, nights, submitting, submitError, darkMode }) {
  const [card, setCard] = useState({ ...EMPTY_CARD });
  const [cardErrors, setCardErrors] = useState({});
  const [cardTouched, setCardTouched] = useState({});

  useEffect(() => { if (open) { setCard({ ...EMPTY_CARD }); setCardErrors({}); setCardTouched({}); } }, [open]);

  const handleCardChange = (e) => {
    const { name, value } = e.target;
    setCard((p) => ({ ...p, [name]: value }));
    if (cardTouched[name]) setCardErrors((prev) => ({ ...prev, [name]: validateCard(name, value) }));
  };

  const handleCardBlur = (name) => {
    setCardTouched((t) => ({ ...t, [name]: true }));
    setCardErrors((prev) => ({ ...prev, [name]: validateCard(name, card[name]) }));
  };

  const handleConfirm = () => {
    const allTouched = {};
    const nextErrors = {};
    ["cardName", "cardNumber", "cardExpiry", "cardCvc"].forEach((f) => {
      allTouched[f] = true;
      nextErrors[f] = validateCard(f, card[f]);
    });
    setCardTouched(allTouched);
    setCardErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    onConfirm(card);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="payment-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center sm:px-4" onClick={onClose}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }} transition={{ duration: 0.3, ease }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full sm:max-w-[520px] max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden ${
              darkMode ? "bg-[#1a2744]" : "bg-white"
            }`}>

            {/* Header */}
            <div className="h-1.5 bg-gradient-to-r from-[#0EA5E9] via-[#3B82F6] to-[#0EA5E9]" />
            <div className={`flex items-center justify-between px-6 py-4 border-b ${darkMode ? "border-white/10" : "border-slate-100"}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                </div>
                <div>
                  <h3 className={`text-base font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Confirm & Pay</h3>
                  <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>Review your booking and enter payment details</p>
                </div>
              </div>
              <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer border-none transition-colors ${darkMode ? "bg-white/5 hover:bg-white/10 text-slate-400" : "bg-slate-100 hover:bg-slate-200 text-slate-500"}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Booking summary */}
              <div className={`rounded-xl p-4 border ${darkMode ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}>
                <div className="flex gap-3 mb-3 pb-3 border-b border-dashed border-slate-200 dark:border-white/10">
                  <img src={tour.image} alt={tour.name} className="w-16 h-12 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <h4 className={`text-sm font-bold truncate ${darkMode ? "text-white" : "text-slate-800"}`}>{tour.name}</h4>
                    <p className={`text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>📍 {tour.location} · ⏱️ {tour.duration}</p>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className={darkMode ? "text-slate-400" : "text-slate-500"}>Guests</span><span className={`font-semibold ${darkMode ? "text-white" : "text-slate-800"}`}>{form.guests} guest{form.guests > 1 ? "s" : ""}</span></div>
                  <div className="flex justify-between"><span className={darkMode ? "text-slate-400" : "text-slate-500"}>Check-in</span><span className={`font-medium ${darkMode ? "text-white" : "text-slate-800"}`}>{form.checkIn}</span></div>
                  <div className="flex justify-between"><span className={darkMode ? "text-slate-400" : "text-slate-500"}>Check-out</span><span className={`font-medium ${darkMode ? "text-white" : "text-slate-800"}`}>{form.checkOut}</span></div>
                  <div className="flex justify-between"><span className={darkMode ? "text-slate-400" : "text-slate-500"}>Duration</span><span className={`font-medium ${darkMode ? "text-white" : "text-slate-800"}`}>{nights} night{nights > 1 ? "s" : ""}</span></div>
                </div>
                <div className={`flex justify-between items-center mt-3 pt-3 border-t ${darkMode ? "border-white/10" : "border-slate-200"}`}>
                  <span className={`text-sm font-bold ${darkMode ? "text-white" : "text-slate-800"}`}>Total</span>
                  <span className="text-lg font-extrabold bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] bg-clip-text text-transparent">₹{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Card fields */}
              <div>
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>💳 Payment Method</h4>
                <div className="space-y-3">
                  <Field label="Cardholder Name" required error={cardTouched.cardName && cardErrors.cardName}>
                    <input type="text" name="cardName" value={card.cardName} onChange={handleCardChange} onBlur={() => handleCardBlur("cardName")}
                      placeholder="As printed on card" autoComplete="cc-name" className={inputCls(cardTouched.cardName && cardErrors.cardName, darkMode)} />
                  </Field>
                  <Field label="Card Number" required error={cardTouched.cardNumber && cardErrors.cardNumber}>
                    <input type="text" name="cardNumber" value={card.cardNumber} onChange={handleCardChange} onBlur={() => handleCardBlur("cardNumber")}
                      placeholder="4242 4242 4242 4242" inputMode="numeric" autoComplete="cc-number" maxLength={23}
                      className={inputCls(cardTouched.cardNumber && cardErrors.cardNumber, darkMode)} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiry" required error={cardTouched.cardExpiry && cardErrors.cardExpiry}>
                      <input type="text" name="cardExpiry" value={card.cardExpiry} onChange={handleCardChange} onBlur={() => handleCardBlur("cardExpiry")}
                        placeholder="MM/YY" inputMode="numeric" autoComplete="cc-exp" maxLength={7}
                        className={inputCls(cardTouched.cardExpiry && cardErrors.cardExpiry, darkMode)} />
                    </Field>
                    <Field label="CVC" required error={cardTouched.cardCvc && cardErrors.cardCvc}>
                      <input type="text" name="cardCvc" value={card.cardCvc} onChange={handleCardChange} onBlur={() => handleCardBlur("cardCvc")}
                        placeholder="123" inputMode="numeric" autoComplete="cc-csc" maxLength={4}
                        className={inputCls(cardTouched.cardCvc && cardErrors.cardCvc, darkMode)} />
                    </Field>
                  </div>
                </div>
                <p className={`text-[10px] mt-2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                  🔐 Test card: <code className={`px-1 py-0.5 rounded ${darkMode ? "bg-white/10" : "bg-slate-100"}`}>4242 4242 4242 4242</code> with any future expiry & CVC
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${darkMode ? "border-white/10 bg-[#162240]" : "border-slate-100 bg-slate-50"}`}>
              <AnimatePresence>
                {submitError && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0 }}
                    className="mb-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs p-3 rounded-xl">
                    ⚠️ {submitError}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button onClick={handleConfirm} disabled={submitting}
                whileHover={submitting ? {} : { scale: 1.01 }} whileTap={submitting ? {} : { scale: 0.98 }}
                className="w-full py-3.5 bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white rounded-xl font-bold text-sm cursor-pointer hover:shadow-lg hover:shadow-[#0EA5E9]/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group">
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 pointer-events-none" />
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                    Processing…
                  </span>
                ) : `Pay ₹${total.toLocaleString()} →`}
              </motion.button>
              <p className={`text-center text-[10px] mt-2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>🔒 Secured with SSL encryption</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════ */
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
  const [showPayment, setShowPayment] = useState(false);
  const formRef = useRef(null);
  const restoredRef = useRef(false);
  const [form, setForm] = useState(() => loadDraft(id) || { ...EMPTY_FORM });
  const addToast = useToast();
  const { token, user } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true); setSubmitted(false); setErrors({}); setTouched({});
    fetchDestinationById(id).then(setTour).catch((e) => setError(e.message)).finally(() => setLoading(false));
    const draft = loadDraft(id);
    if (draft) setForm({ ...draft }); else setForm({ ...EMPTY_FORM });
    restoredRef.current = false;
  }, [id]);

  useEffect(() => {
    if (loading || error || !tour || submitted) return;
    const hasContent = Object.entries(form).some(([k, v]) => { if (k === "guests") return Number(v) !== 1; if (k === "tripType") return v !== "couple"; return Boolean(v); });
    if (hasContent) saveDraft(id, form);
  }, [form, id, loading, error, tour, submitted]);

  useEffect(() => {
    if (!user || !tour || loading || submitted) return;
    setForm((p) => { const n = { ...p }; if (!n.name) n.name = user.name || n.name; if (!n.email) n.email = user.email || n.email; if (!n.confirmEmail) n.confirmEmail = n.email || n.confirmEmail; if (!n.phone) n.phone = user.phone || n.phone; return n; });
  }, [user, tour, loading, submitted]);

  useEffect(() => {
    if (restoredRef.current) return;
    const draft = loadDraft(id);
    if (!draft) return;
    const hasContent = Object.entries(draft).some(([k, v]) => { if (k === "guests") return Number(v) !== 1; if (k === "tripType") return v !== "couple"; return Boolean(v); });
    if (!hasContent) return;
    restoredRef.current = true;
    try { if (!sessionStorage.getItem(RESTORED_FLAG(id))) { sessionStorage.setItem(RESTORED_FLAG(id), "1"); addToast("info", "We restored your previous draft."); } } catch { /* noop */ }
  }, [id, addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (touched[name]) setErrors((prev) => ({ ...prev, [name]: validateField(name, value, { ...form, [name]: value }) }));
  };

  const handleBlur = (name) => {
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, form[name], form) }));
  };

  const handleResetDraft = () => { setForm({ ...EMPTY_FORM }); setErrors({}); setTouched({}); clearDraft(id); addToast("success", "Form cleared."); };

  const scrollToFirstError = (errs) => {
    const fields = ["name","email","confirmEmail","phone","address","nationality","checkIn","checkOut","guests"];
    for (const f of fields) { if (errs[f]) { const el = formRef.current?.querySelector(`[name="${f}"]`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); break; } }
  };

  /* validate traveller fields → open payment dialog */
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    const travellerFields = ["name","email","confirmEmail","phone","address","nationality","checkIn","checkOut","guests"];
    const allTouched = {};
    const nextErrors = {};
    travellerFields.forEach((f) => { allTouched[f] = true; nextErrors[f] = validateField(f, form[f], form); });
    setTouched(allTouched);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) { scrollToFirstError(nextErrors); addToast("error", "Please fix the highlighted fields."); return; }
    setShowPayment(true);
  };

  /* called from payment dialog after card validation passes */
  const handlePaymentConfirm = async (card) => {
    setSubmitting(true); setSubmitError(null);
    try {
      await createBooking({
        tourId: Number(id), tourName: tour.name,
        name: form.name, email: form.email, confirmEmail: form.confirmEmail,
        phone: form.phone, address: form.address, nationality: form.nationality,
        checkIn: form.checkIn, checkOut: form.checkOut,
        guests: Number(form.guests), tripType: form.tripType,
        specialRequests: form.specialRequests,
        total, currency: "INR",
        payment: { name: card.cardName, number: card.cardNumber.replace(/\s+/g, ""), expiry: card.cardExpiry, cvc: card.cardCvc },
      }, token);
      setSubmitted(true); setShowPayment(false); clearDraft(id); addToast("success", "Booking confirmed!");
    } catch (err) { setSubmitError(err.message); addToast("error", err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-[1fr_370px] gap-8">
        <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className="bg-white/50 dark:bg-[#1E2E4F]/50 rounded-2xl p-4 animate-pulse"><div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/4 mb-3" /><div className="h-10 bg-slate-200 dark:bg-white/10 rounded-xl" /></div>))}</div>
        <div className="bg-white/50 dark:bg-[#1E2E4F]/50 rounded-2xl p-6 animate-pulse"><div className="h-32 bg-slate-200 dark:bg-white/10 rounded-xl mb-4" /><div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4 mb-2" /><div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-1/2" /></div>
      </div>
    </div>
  );

  if (error || !tour) return (
    <div className="pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-[#0EA5E9]/20 to-[#3B82F6]/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"><span className="text-4xl sm:text-5xl">😕</span></div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mb-2">Tour Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 sm:mb-8 text-sm">{error || "The tour you're looking for doesn't exist."}</p>
        <Link to="/destinations" className="inline-block bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold no-underline hover:-translate-y-0.5 transition-all shadow-md hover:shadow-xl text-sm sm:text-base">Browse Tours</Link>
      </motion.div>
    </div>
  );

  const nights = form.checkIn && form.checkOut ? Math.max(1, Math.round((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000)) : 1;
  const subtotal = tour.price * Number(form.guests) * nights;
  const taxes = Math.round(subtotal * 0.1);
  const total = subtotal + taxes;

  if (submitted) return (
    <div className="mt-10 pb-10 pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c] flex items-center justify-center px-4 sm:px-6">
      <motion.div initial={{ opacity: 0, scale: 0.93, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.5, ease }}
        className="bg-white dark:bg-[#1E2E4F] rounded-3xl p-6 sm:p-8 md:p-12 text-center max-w-[520px] w-full shadow-2xl border border-slate-100 dark:border-white/5">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
          className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl mx-auto mb-5 sm:mb-6 shadow-xl shadow-emerald-400/30">✓</motion.div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Booking Confirmed!</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 sm:mb-8">Thank you, <strong className="text-slate-800 dark:text-white">{form.name}</strong>!<br />Your adventure to <strong className="text-[#0EA5E9]">{tour.name}</strong> is all set.</p>
        <div className="bg-gradient-to-br from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c] rounded-2xl p-5 sm:p-6 mb-6 sm:mb-8 text-left divide-y divide-slate-200/60 dark:divide-white/8">
          {[{ l: "Tour Package", v: tour.name, icon: "🏝️" }, { l: "Check-in", v: form.checkIn, icon: "📅" }, { l: "Check-out", v: form.checkOut, icon: "📅" }, { l: "Guests", v: `${form.guests} guest${form.guests > 1 ? "s" : ""}`, icon: "👥" }, { l: "Duration", v: `${nights} night${nights > 1 ? "s" : ""}`, icon: "⏰" }, { l: "Total Paid", v: `\u20B9${total.toLocaleString()}`, icon: "💰" }].map((item) => (
            <div key={item.l} className="flex justify-between py-2.5 sm:py-3 text-sm"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><span>{item.icon}</span> {item.l}</span><span className="text-slate-800 dark:text-white font-semibold">{item.v}</span></div>
          ))}
        </div>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link to="/" className="bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold no-underline hover:-translate-y-0.5 hover:shadow-lg transition-all text-sm">Back to Home</Link>
          <Link to="/destinations" className="border-2 border-[#0EA5E9] text-[#0EA5E9] px-6 sm:px-8 py-3 sm:py-3.5 rounded-full font-semibold no-underline hover:bg-[#0EA5E9] hover:text-white transition-all text-sm">Explore More</Link>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="pt-[70px] min-h-screen bg-gradient-to-b from-[#f8f6f1] to-[#efebe4] dark:from-[#0f172a] dark:to-[#0a0f1c]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Hero */}
      <div className="relative h-[240px] sm:h-[280px] md:h-[320px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={tour.image} alt={tour.name} className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f172a]/90 via-[#0f172a]/70 to-[#0f172a]/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
        </div>
        <div className="relative z-10 text-center text-white px-4 sm:px-6">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Secure Your Adventure</motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5, ease }} className="text-white/80 text-base sm:text-lg">{tour.name}</motion.p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Breadcrumb */}
        <motion.nav initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease }}
          className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-8 flex-wrap">
          <Link to="/" className="text-[#0EA5E9] hover:underline">Home</Link><span className="text-slate-400">/</span>
          <Link to="/destinations" className="text-[#0EA5E9] hover:underline">Destinations</Link><span className="text-slate-400">/</span>
          <Link to={`/tour/${id}`} className="text-[#0EA5E9] hover:underline truncate max-w-[150px]">{tour.name}</Link><span className="text-slate-400">/</span>
          <span className="text-slate-600 dark:text-slate-300 font-semibold">Book Now</span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-10 items-start">
          {/* FORM — Traveller Details only */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.5, ease }}>
            <div className="bg-white dark:bg-[#1E2E4F] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] flex items-center justify-center text-white font-bold">1</div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-white flex-1">Traveller Details</h2>
                <motion.button type="button" onClick={handleResetDraft} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-500 dark:hover:text-rose-400 px-3 py-1.5 rounded-full transition-colors cursor-pointer border-none">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22Z"/></svg>
                  Clear draft
                </motion.button>
              </div>

              <AutoSaveBadge form={form} />

              <form ref={formRef} onSubmit={handleProceedToPayment} noValidate className="space-y-5">
                {/* Name + Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Full Name" required error={touched.name && errors.name} icon="👤">
                    <input type="text" name="name" value={form.name} onChange={handleChange} onBlur={() => handleBlur("name")} placeholder="John Doe" autoComplete="name" className={inputCls(touched.name && errors.name, darkMode)} />
                  </Field>
                  <Field label="Email Address" required error={touched.email && errors.email} icon="📧">
                    <input type="email" name="email" value={form.email} onChange={handleChange} onBlur={() => handleBlur("email")} placeholder="john@example.com" autoComplete="email" className={inputCls(touched.email && errors.email, darkMode)} />
                  </Field>
                </div>

                {/* Confirm Email + Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Confirm Email" required error={touched.confirmEmail && errors.confirmEmail} icon="✓">
                    <input type="email" name="confirmEmail" value={form.confirmEmail} onChange={handleChange} onBlur={() => handleBlur("confirmEmail")} placeholder="john@example.com" autoComplete="email" className={inputCls(touched.confirmEmail && errors.confirmEmail, darkMode)} />
                  </Field>
                  <Field label="Phone Number" required error={touched.phone && errors.phone} icon="📞">
                    <input type="tel" name="phone" value={form.phone} onChange={handleChange} onBlur={() => handleBlur("phone")} placeholder="1234567890" autoComplete="tel" maxLength={10} inputMode="numeric" className={inputCls(touched.phone && errors.phone, darkMode)} />
                  </Field>
                </div>

                {/* Address + Nationality */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Address" required error={touched.address && errors.address} icon="🏠">
                    <input type="text" name="address" value={form.address} onChange={handleChange} onBlur={() => handleBlur("address")} placeholder="123 Main Street, City" autoComplete="street-address" className={inputCls(touched.address && errors.address, darkMode)} />
                  </Field>
                  <Field label="Nationality" required error={touched.nationality && errors.nationality} icon="🌍">
                    <SelectDropdown options={COUNTRIES} value={form.nationality}
                      onChange={(v) => { setForm((p) => ({ ...p, nationality: v })); if (touched.nationality) setErrors((prev) => ({ ...prev, nationality: validateField("nationality", v, form) })); }}
                      onBlur={() => handleBlur("nationality")} placeholder="Select nationality" searchPlaceholder="Search countries..."
                      error={touched.nationality && errors.nationality} darkMode={darkMode} />
                  </Field>
                </div>

                {/* Guests + Trip Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Number of Guests" required error={touched.guests && errors.guests} icon="👥">
                    <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-colors ${touched.guests && errors.guests ? "border-rose-400" : darkMode ? "border-white/10 focus-within:border-[#0EA5E9]" : "border-slate-200 focus-within:border-[#0EA5E9]"}`}>
                      <button type="button" onClick={() => { const n = Math.max(1, Number(form.guests) - 1); setForm((p) => ({ ...p, guests: n })); setErrors((p) => ({ ...p, guests: validateField("guests", String(n), form) })); }}
                        className={`w-11 h-[46px] text-xl font-bold transition-colors cursor-pointer border-none flex items-center justify-center shrink-0 ${darkMode ? "bg-white/5 text-[#0EA5E9] hover:bg-[#0EA5E9]/20" : "bg-slate-50 text-[#0EA5E9] hover:bg-[#0EA5E9]/10"}`}>−</button>
                      <input type="number" name="guests" value={form.guests} onChange={handleChange} min={1} max={20} aria-label="Guests"
                        className={`flex-1 py-3 text-center text-sm font-semibold outline-none border-none ${darkMode ? "bg-[#1E2E4F] text-white" : "bg-white text-slate-800"}`} />
                      <button type="button" onClick={() => { const n = Math.min(20, Number(form.guests) + 1); setForm((p) => ({ ...p, guests: n })); setErrors((p) => ({ ...p, guests: validateField("guests", String(n), form) })); }}
                        className={`w-11 h-[46px] text-xl font-bold transition-colors cursor-pointer border-none flex items-center justify-center shrink-0 ${darkMode ? "bg-white/5 text-[#0EA5E9] hover:bg-[#0EA5E9]/20" : "bg-slate-50 text-[#0EA5E9] hover:bg-[#0EA5E9]/10"}`}>+</button>
                    </div>
                  </Field>
                  <Field label="Trip Type" icon="✈️">
                    <select name="tripType" value={form.tripType} onChange={handleChange} className={`${inputCls(false, darkMode)} cursor-pointer`}>
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
                    <input type="date" name="checkIn" value={form.checkIn} onChange={handleChange} onBlur={() => handleBlur("checkIn")} min={TODAY} className={inputCls(touched.checkIn && errors.checkIn, darkMode)} />
                  </Field>
                  <Field label="Check-out Date" required error={touched.checkOut && errors.checkOut} icon="📅">
                    <input type="date" name="checkOut" value={form.checkOut} onChange={handleChange} onBlur={() => handleBlur("checkOut")} min={form.checkIn || TODAY} className={inputCls(touched.checkOut && errors.checkOut, darkMode)} />
                  </Field>
                </div>

                {/* Special Requests */}
                <Field label="Special Requests" icon="✏️">
                  <textarea name="specialRequests" value={form.specialRequests} onChange={handleChange}
                    placeholder="Dietary requirements, accessibility needs, special occasions, or anything else we should know..."
                    rows={3} className={`${inputCls(false, darkMode)} resize-none`} />
                </Field>

                {/* Proceed button */}
                <motion.button type="submit"
                  whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg cursor-pointer hover:shadow-xl hover:shadow-[#0EA5E9]/30 transition-all duration-300 relative overflow-hidden group">
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out pointer-events-none" />
                  Proceed to Payment →
                </motion.button>
              </form>
            </div>
          </motion.div>

          {/* SUMMARY SIDEBAR */}
          <motion.aside initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.5, ease }}
            className="lg:sticky lg:top-[90px] self-start">
            <div className="bg-white dark:bg-[#1E2E4F] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-100 dark:border-white/5">
              <div className="h-2 bg-gradient-to-r from-[#0EA5E9] via-[#3B82F6] to-[#0EA5E9]" />
              <div className="p-6 sm:p-7">
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white mb-5 pb-3 border-b border-slate-100 dark:border-white/10 flex items-center gap-2"><span>📋</span> Booking Summary</h3>
                <div className="flex gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-white/10">
                  <img src={tour.image} alt={tour.name} className="w-20 h-16 rounded-xl object-cover shrink-0 shadow-md" />
                  <div className="min-w-0">
                    <h4 className="text-base font-bold text-slate-800 dark:text-white mb-1 leading-tight">{tour.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"><span>📍 {tour.location}</span><span>•</span><span>⏱️ {tour.duration}</span></div>
                    <div className="flex items-center gap-1 mt-2"><span className="text-[#F59E0B]">★</span><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{tour.rating}</span></div>
                  </div>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Price per person</span><span className="font-semibold text-slate-800 dark:text-white">₹{tour.price.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">× {nights} night{nights > 1 ? "s" : ""}</span><span className="font-semibold text-slate-800 dark:text-white">₹{(tour.price * nights).toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">× {form.guests} guest{form.guests > 1 ? "s" : ""}</span><span className="font-semibold text-slate-800 dark:text-white">₹{subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-100 dark:border-white/10"><span className="text-slate-500 dark:text-slate-400">Taxes & Fees (10%)</span><span className="font-semibold text-slate-800 dark:text-white">₹{taxes.toLocaleString()}</span></div>
                  {form.checkIn && <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">📅 Check-in</span><span className="font-medium text-slate-800 dark:text-white">{form.checkIn}</span></div>}
                  {form.checkOut && <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">📅 Check-out</span><span className="font-medium text-slate-800 dark:text-white">{form.checkOut}</span></div>}
                </div>
                <div className="flex justify-between items-center py-4 border-t-2 border-slate-200 dark:border-white/15 mb-6">
                  <span className="text-lg font-extrabold text-slate-800 dark:text-white">Total Amount</span>
                  <motion.span key={total} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-[#0EA5E9] to-[#3B82F6] bg-clip-text text-transparent">₹{total.toLocaleString()}</motion.span>
                </div>
                <div className="bg-gradient-to-r from-[#0EA5E9]/5 to-[#3B82F6]/5 dark:from-[#0EA5E9]/10 dark:to-[#3B82F6]/10 rounded-xl p-4 mb-6">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">✨ Package Includes</p>
                  <ul className="space-y-2">
                    {tour.facilities.slice(0, 5).map((f, i) => (
                      <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <span className="w-4 h-4 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0">✓</span>
                        <span>{f}</span>
                      </motion.li>
                    ))}
                    {tour.facilities.length > 5 && <li className="text-xs text-slate-400 pl-6">+{tour.facilities.length - 5} more amenities</li>}
                  </ul>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 pt-3 border-t border-slate-100 dark:border-white/10">
                  <span className="text-sm">🔒</span><span>Secure checkout powered by SSL encryption</span>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      </div>

      {/* PAYMENT DIALOG */}
      <PaymentDialog open={showPayment} onClose={() => setShowPayment(false)} onConfirm={handlePaymentConfirm}
        tour={tour} form={form} total={total} nights={nights}
        submitting={submitting} submitError={submitError} darkMode={darkMode} />
    </div>
  );
}
