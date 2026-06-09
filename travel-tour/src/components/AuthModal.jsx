import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import { useGoogleLogin } from "@react-oauth/google";

const ease = [0.22, 1, 0.36, 1];

/* ── Field-level validation rules ── */
function validateField(name, value, extra) {
  switch (name) {
    case "name":
      if (!value.trim()) return "Full name is required";
      if (value.trim().length < 2) return "Name must be at least 2 characters";
      if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return "Name can only contain letters, spaces, hyphens and apostrophes";
      return "";
    case "email":
      if (!value.trim()) return "Email is required";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        return "Enter a valid email address";
      }
      return "";
    case "password":
      if (!value) return "Password is required";
      if (value.length < 6) return "Password must be at least 6 characters";
      if (!/[A-Z]/.test(value)) return "Must contain at least one uppercase letter";
      if (!/[0-9]/.test(value)) return "Must contain at least one number";
      return "";
    case "confirmPassword":
      if (!value) return "Please confirm your password";
      if (value !== extra) return "Passwords do not match";
      return "";
    default:
      return "";
  }
}

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-amber-400" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-400" };
  if (score <= 4) return { score, label: "Strong", color: "bg-emerald-400" };
  return { score, label: "Very Strong", color: "bg-emerald-500" };
}

/* ── Reusable input ── */
function Field({ label, id, type = "text", value, onChange, onBlur, placeholder, error, touched, darkMode, suffix = null }) {
  const hasError = touched && error;
  const isValid = touched && !error && value;

  return (
    <div className="mb-4">
      <label htmlFor={id} className={`block text-xs font-semibold mb-1.5 tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={id}
          className={`w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 border ${
            hasError
              ? darkMode
                ? "bg-red-500/10 border-red-500/50 text-white placeholder:text-slate-500"
                : "bg-red-50 border-red-400 text-[#0a0f1e] placeholder:text-slate-400"
              : isValid
              ? darkMode
                ? "bg-emerald-500/10 border-emerald-500/40 text-white placeholder:text-slate-500"
                : "bg-emerald-50/60 border-emerald-400 text-[#0a0f1e] placeholder:text-slate-400"
              : darkMode
              ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#31487A]/50 focus:bg-white/10"
              : "bg-slate-50 border-slate-200 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#31487A]/50 focus:bg-white"
          } ${suffix ? "pr-10" : ""}`}
        />
        {/* State icon or suffix */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {suffix}
          {!suffix && hasError && (
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
          )}
          {!suffix && isValid && (
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
            </svg>
          )}
        </div>
      </div>
      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-red-500 mt-1.5 flex items-center gap-1 overflow-hidden"
          >
            <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuthModal({ isOpen, onClose, initialTab = "login" }) {
  const [tab, setTab] = useState(initialTab);
  const [fields, setFields] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login, register, loginWithGoogle } = useAuth();
  const addToast = useToast();
  const { darkMode } = useTheme();
  const firstFieldRef = useRef(null);
  const modalRef = useRef(null);

  /* sync tab when prop changes */
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    }
  }, [initialTab, isOpen]);

  /* reset on open */
  useEffect(() => {
    if (isOpen) {
      setFields({ name: "", email: "", password: "", confirmPassword: "" });
      setTouched({});
      setGlobalError("");
      setShowPassword(false);
      setShowConfirm(false);
      setTimeout(() => firstFieldRef.current?.focus(), 150);
    }
  }, [isOpen]);

  /* ESC to close */
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onClose]);

  /* lock body scroll */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const switchTab = (t) => {
    setTab(t);
    setTouched({});
    setGlobalError("");
    setFields({ name: "", email: "", password: "", confirmPassword: "" });
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        setSubmitting(true);
        setGlobalError("");
        await loginWithGoogle(response.credential || response.access_token);
        addToast("success", "Signed in with Google!");
        onClose();
      } catch (err) {
        setGlobalError(err.message || "Google sign-in failed. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    onError: () => {
      setGlobalError("Google sign-in was cancelled or failed.");
    },
  });

  const handleChange = (field) => (e) => {
    setFields((f) => ({ ...f, [field]: e.target.value }));
    if (touched[field]) setGlobalError("");
  };

  const handleBlur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
  };

  /* per-field errors */
  const errors = {
    name:            validateField("name",            fields.name),
    email:           validateField("email",           fields.email),
    password:        validateField("password",        fields.password),
    confirmPassword: validateField("confirmPassword", fields.confirmPassword, fields.password),
  };

  const activeFields = tab === "login"
    ? ["email", "password"]
    : ["name", "email", "password", "confirmPassword"];

  const isFormValid = activeFields.every((f) => !errors[f]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    /* touch all fields */
    const allTouched = {};
    activeFields.forEach((f) => (allTouched[f] = true));
    setTouched(allTouched);

    if (!isFormValid) return;

    setSubmitting(true);
    setGlobalError("");
    try {
      if (tab === "login") {
        await login({ email: fields.email, password: fields.password });
        addToast("success", "Welcome back!");
      } else {
        await register({ name: fields.name, email: fields.email, password: fields.password });
        addToast("success", "Account created successfully!");
      }
      onClose();
    } catch (err) {
      setGlobalError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const pwStrength = getPasswordStrength(fields.password);

  /* eye-toggle suffix */
  const eyeSuffix = (show, toggle) => (
    <button
      type="button"
      tabIndex={-1}
      onClick={toggle}
      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors cursor-pointer pointer-events-auto ${
        darkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"
      }`}
    >
      {show ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
      )}
    </button>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="auth-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal — height animates between tabs */}
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.28, ease }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
              darkMode ? "bg-gradient-to-br from-[#1a2a45] to-[#152238]" : "bg-white"
            }`}
            // On login: fit content (no scroll). On signup: cap at 80vh so it scrolls.
            style={{
              maxHeight: tab === "signup" ? "90vh" : "97vh",
            }}
          >
            {/* Top accent gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#31487A] via-[#4a6fa5] to-[#818cf8]" />

            {/* Background decorative circles */}
            <div className="pointer-events-none absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #31487A, transparent 70%)" }} />
            <div className="pointer-events-none absolute -bottom-32 -left-32 w-64 h-64 rounded-full opacity-10"
              style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }} />

            {/* Close button */}
            <motion.button
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.88 }}
              className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                darkMode
                  ? "text-slate-400 hover:bg-white/10 hover:text-white"
                  : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              }`}
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </motion.button>

            {/*
              Inner content:
              - Login  → overflow-y-hidden (no scroll, modal sizes to content)
              - Signup → overflow-y-auto   (scrolls when taller than maxHeight)
            */}
            <div
              className={`px-8 pt-8 pb-10 ${
                tab === "signup" ? "overflow-y-auto" : "overflow-y-hidden"
              }`}
              style={{
                // Signup: scrollable region fills the capped modal height.
                // Login:  no constraint — modal naturally wraps its content.
                flex: tab === "signup" ? "1 1 auto" : "0 0 auto",
                scrollbarWidth: "thin",
              }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg ${
                    darkMode
                      ? "bg-gradient-to-br from-[#31487A]/30 to-[#31487A]/20 border border-white/10"
                      : "bg-gradient-to-br from-[#31487A]/10 to-[#31487A]/5 border border-[#31487A]/20"
                  }`}
                >
                  <span className="text-3xl">✈️</span>
                </motion.div>
                <h2
                  className={`text-2xl font-bold mb-1 ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {tab === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {tab === "login" ? "Sign in to continue your journey" : "Start your adventure with us"}
                </p>
              </div>

              {/* Tab switcher */}
              <div className={`flex rounded-xl p-1 mb-6 ${darkMode ? "bg-white/10" : "bg-slate-100"}`}>
                {["login", "signup"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => switchTab(t)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      tab === t
                        ? "bg-gradient-to-r from-[#31487A] to-[#4a6fa5] text-white shadow-lg"
                        : darkMode
                          ? "text-slate-400 hover:text-white hover:bg-white/5"
                          : "text-slate-500 hover:text-[#0a0f1e] hover:bg-white"
                    }`}
                  >
                    {t === "login" ? "Login" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Google Sign-In */}
              <motion.button
                type="button"
                onClick={() => googleLogin()}
                disabled={submitting}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 border transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mb-6 ${
                  darkMode
                    ? "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                    : "bg-white border-slate-200 text-[#0a0f1e] hover:bg-slate-50 hover:border-slate-300"
                }`}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                {tab === "login" ? "Continue with Google" : "Sign up with Google"}
              </motion.button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`flex-1 h-px ${darkMode ? "bg-white/10" : "bg-slate-200"}`} />
                <span className={`text-xs font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}>or continue with email</span>
                <div className={`flex-1 h-px ${darkMode ? "bg-white/10" : "bg-slate-200"}`} />
              </div>

              {/* Global error */}
              <AnimatePresence>
                {globalError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6"
                  >
                    <div className={`flex items-start gap-2.5 text-sm px-4 py-3 rounded-xl ${
                      darkMode ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-200"
                    }`}>
                      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/>
                      </svg>
                      {globalError}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate>
                {/* Name — signup only */}
                <AnimatePresence mode="wait">
                  {tab === "signup" && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Field
                        label="Full Name"
                        id="name"
                        value={fields.name}
                        onChange={handleChange("name")}
                        onBlur={handleBlur("name")}
                        placeholder="John Doe"
                        error={errors.name}
                        touched={touched.name}
                        darkMode={darkMode}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <Field
                  label="Email Address"
                  id="email"
                  type="email"
                  value={fields.email}
                  onChange={handleChange("email")}
                  onBlur={handleBlur("email")}
                  placeholder="you@example.com"
                  error={errors.email}
                  touched={touched.email}
                  darkMode={darkMode}
                />

                {/* Password */}
                <div className="mb-4">
                  <Field
                    label="Password"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={fields.password}
                    onChange={handleChange("password")}
                    onBlur={handleBlur("password")}
                    placeholder="At least 6 characters"
                    error={errors.password}
                    touched={touched.password}
                    darkMode={darkMode}
                    suffix={eyeSuffix(showPassword, () => setShowPassword((v) => !v))}
                  />

                  {/* Password strength bar — signup only */}
                  <AnimatePresence>
                    {tab === "signup" && fields.password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="mt-2"
                      >
                        <div className="flex gap-1 mb-1.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                i <= pwStrength.score ? pwStrength.color : darkMode ? "bg-white/10" : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center">
                          <p className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                            Use uppercase, numbers & symbols
                          </p>
                          <p className={`text-[10px] font-semibold ${
                            pwStrength.score <= 1 ? "text-red-500" :
                            pwStrength.score <= 2 ? "text-amber-500" :
                            pwStrength.score <= 3 ? "text-yellow-500" : "text-emerald-500"
                          }`}>
                            {pwStrength.label}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirm password — signup only */}
                <AnimatePresence mode="wait">
                  {tab === "signup" && (
                    <motion.div
                      key="confirm-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Field
                        label="Confirm Password"
                        id="confirmPassword"
                        type={showConfirm ? "text" : "password"}
                        value={fields.confirmPassword}
                        onChange={handleChange("confirmPassword")}
                        onBlur={handleBlur("confirmPassword")}
                        placeholder="Re-enter your password"
                        error={errors.confirmPassword}
                        touched={touched.confirmPassword}
                        darkMode={darkMode}
                        suffix={eyeSuffix(showConfirm, () => setShowConfirm((v) => !v))}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={!submitting ? { scale: 1.01, y: -1 } : {}}
                  whileTap={!submitting ? { scale: 0.99 } : {}}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm cursor-pointer mt-2 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, #31487A 0%, #4a6fa5 100%)",
                    boxShadow: "0 4px 15px rgba(49,72,122,0.3)",
                  }}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 pointer-events-none" />
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      {tab === "login" ? "Signing in..." : "Creating account..."}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {tab === "login" ? "Sign In" : "Create Account"}
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </span>
                  )}
                </motion.button>
              </form>

              {/* Switch tab */}
              <p className={`text-center mt-6 text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {tab === "login" ? (
                  <>Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchTab("signup")}
                      className="text-[#4a6fa5] font-semibold bg-transparent border-none cursor-pointer hover:underline transition-all"
                    >
                      Sign up free
                    </button>
                  </>
                ) : (
                  <>Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchTab("login")}
                      className="text-[#4a6fa5] font-semibold bg-transparent border-none cursor-pointer hover:underline transition-all"
                    >
                      Log in
                    </button>
                  </>
                )}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
