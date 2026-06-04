import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";

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
  const isValid  = touched && !error && value;

  return (
    <div>
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
          className={`w-full px-4 py-3 pr-10 rounded-xl text-sm outline-none transition-all duration-200 border ${
            hasError
              ? darkMode
                ? "bg-red-500/8 border-red-500/50 text-white placeholder:text-slate-500"
                : "bg-red-50 border-red-400 text-[#0a0f1e] placeholder:text-slate-400"
              : isValid
              ? darkMode
                ? "bg-emerald-500/8 border-emerald-500/40 text-white placeholder:text-slate-500"
                : "bg-emerald-50/60 border-emerald-400 text-[#0a0f1e] placeholder:text-slate-400"
              : darkMode
              ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#38bdf8]/50 focus:bg-white/8"
              : "bg-slate-50 border-slate-200 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#38bdf8]/50 focus:bg-white"
          }`}
        />
        {/* State icon */}
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

  const { login, register } = useAuth();
  const addToast = useToast();
  const { darkMode } = useTheme();
  const firstFieldRef = useRef(null);

  /* sync tab when prop changes */
  useEffect(() => { setTab(initialTab); }, [initialTab, isOpen]);

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
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const switchTab = (t) => {
    setTab(t);
    setTouched({});
    setGlobalError("");
    setFields({ name: "", email: "", password: "", confirmPassword: "" });
  };

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
      className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${darkMode ? "text-slate-500 hover:text-slate-300" : "text-slate-400 hover:text-slate-600"}`}
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
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ duration: 0.28, ease }}
            onClick={(e) => e.stopPropagation()}
            className={`relative w-full sm:max-w-[440px] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden ${
              darkMode ? "bg-[#0b1626]" : "bg-white"
            }`}
          >
            {/* Top accent line */}
            <div className="h-1 bg-gradient-to-r from-[#38bdf8] via-[#60a5fa] to-[#818cf8]" />

            {/* Ambient glows */}
            <div className="pointer-events-none absolute -top-24 -right-24 w-48 h-48 rounded-full opacity-20"
              style={{ background: "radial-gradient(circle, #38bdf8, transparent 70%)" }} />
            <div className="pointer-events-none absolute -bottom-20 -left-20 w-40 h-40 rounded-full opacity-15"
              style={{ background: "radial-gradient(circle, #818cf8, transparent 70%)" }} />

            {/* Drag handle (mobile) */}
            <div className="sm:hidden flex justify-center pt-3">
              <div className={`w-10 h-1 rounded-full ${darkMode ? "bg-white/20" : "bg-slate-200"}`} />
            </div>

            {/* Close button */}
            <motion.button
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.88 }}
              className={`absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                darkMode ? "text-slate-500 hover:bg-white/8 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              }`}
              aria-label="Close"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </motion.button>

            <div className="px-7 pt-6 pb-8">
              {/* Header */}
              <div className="text-center mb-6">
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg ${
                  darkMode ? "bg-gradient-to-br from-[#38bdf8]/20 to-[#60a5fa]/10 border border-white/8" : "bg-gradient-to-br from-[#38bdf8]/10 to-[#60a5fa]/10 border border-[#38bdf8]/20"
                }`}>
                  <span className="text-2xl">✈️</span>
                </div>
                <h2
                  className={`text-2xl font-bold ${darkMode ? "text-white" : "text-[#0a0f1e]"}`}
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {tab === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                  {tab === "login" ? "Sign in to continue your journey" : "Start your adventure with us"}
                </p>
              </div>

              {/* Tab switcher */}
              <div className={`flex rounded-xl p-1 mb-6 ${darkMode ? "bg-white/5" : "bg-slate-100"}`}>
                {["login", "signup"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => switchTab(t)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer border-none ${
                      tab === t
                        ? "bg-gradient-to-r from-[#38bdf8] to-[#60a5fa] text-white shadow-md shadow-[#38bdf8]/25"
                        : darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-[#0a0f1e]"
                    }`}
                  >
                    {t === "login" ? "Login" : "Sign Up"}
                  </button>
                ))}
              </div>

              {/* Global error */}
              <AnimatePresence>
                {globalError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden"
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
              <form onSubmit={handleSubmit} noValidate className="space-y-4">

                {/* Name — signup only */}
                <AnimatePresence>
                  {tab === "signup" && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
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
                <div>
                  <div className="relative">
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
                  </div>
                  {/* Password strength bar — signup only */}
                  <AnimatePresence>
                    {tab === "signup" && fields.password && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="mt-2 overflow-hidden"
                      >
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
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
                <AnimatePresence>
                  {tab === "signup" && (
                    <motion.div
                      key="confirm-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="relative">
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Forgot password */}
                {tab === "login" && (
                  <div className="text-right -mt-1">
                    <button
                      type="button"
                      className="text-xs text-[#38bdf8] hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={!submitting ? { scale: 1.015, y: -1 } : {}}
                  whileTap={!submitting ? { scale: 0.98 } : {}}
                  className="w-full py-3.5 rounded-xl text-white font-semibold text-sm cursor-pointer border-none mt-1 disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden group"
                  style={{
                    background: "linear-gradient(135deg, #38bdf8 0%, #60a5fa 100%)",
                    boxShadow: "0 6px 24px rgba(14,165,233,0.3)",
                  }}
                >
                  {/* Shine sweep */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 pointer-events-none" />
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                        className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      {tab === "login" ? "Signing in…" : "Creating account…"}
                    </span>
                  ) : (
                    tab === "login" ? "Sign In →" : "Create Account →"
                  )}
                </motion.button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className={`flex-1 h-px ${darkMode ? "bg-white/8" : "bg-slate-200"}`} />
                <span className={`text-xs ${darkMode ? "text-slate-600" : "text-slate-400"}`}>or continue with</span>
                <div className={`flex-1 h-px ${darkMode ? "bg-white/8" : "bg-slate-200"}`} />
              </div>

              {/* Social buttons */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                {[
                  {
                    name: "Google",
                    icon: (
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.198 2.698 1.24 6.65l4.026 3.115Z"/>
                        <path fill="#34A853" d="M16.04 18.013c-1.09.703-2.474 1.078-4.04 1.078a7.077 7.077 0 0 1-6.723-4.823l-4.04 3.067A11.965 11.965 0 0 0 12 24c2.933 0 5.735-1.043 7.834-3l-3.793-2.987Z"/>
                        <path fill="#4A90E2" d="M19.834 21c2.195-2.048 3.62-5.096 3.62-9 0-.71-.109-1.473-.272-2.182H12v4.637h6.436c-.317 1.559-1.17 2.766-2.395 3.558L19.834 21Z"/>
                        <path fill="#FBBC05" d="M5.277 14.268A7.12 7.12 0 0 1 4.909 12c0-.782.125-1.533.357-2.235L1.24 6.65A11.934 11.934 0 0 0 0 12c0 1.92.445 3.73 1.237 5.335l4.04-3.067Z"/>
                      </svg>
                    ),
                  },
                  {
                    name: "GitHub",
                    icon: (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                      </svg>
                    ),
                  },
                ].map((provider) => (
                  <button
                    key={provider.name}
                    type="button"
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all border cursor-pointer ${
                      darkMode
                        ? "bg-white/4 border-white/8 text-slate-300 hover:bg-white/8 hover:border-white/15 hover:text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 shadow-sm"
                    }`}
                  >
                    {provider.icon}
                    {provider.name}
                  </button>
                ))}
              </div>

              {/* Switch tab */}
              <p className={`text-center text-sm ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {tab === "login" ? (
                  <>Don&apos;t have an account?{" "}
                    <button type="button" onClick={() => switchTab("signup")} className="text-[#38bdf8] font-semibold bg-transparent border-none cursor-pointer hover:underline">
                      Sign up free
                    </button>
                  </>
                ) : (
                  <>Already have an account?{" "}
                    <button type="button" onClick={() => switchTab("login")} className="text-[#38bdf8] font-semibold bg-transparent border-none cursor-pointer hover:underline">
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