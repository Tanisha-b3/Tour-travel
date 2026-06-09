import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import { updateMyProfile, changeMyPassword } from "../api";

const ease = [0.22, 1, 0.36, 1];

const NAME_MIN = 2;
const NAME_MAX = 80;
const PASS_MIN = 6;
const PHONE_RE = /^[+]?[\d\s()-]{7,20}$/;

function Field({ label, error, darkMode, hint, children }) {
  return (
    <div>
      <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wide ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
      {error && <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
        <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/></svg>
        {error}
      </p>}
    </div>
  );
}

const inputCls = (darkMode, hasError) =>
  `w-full px-3.5 py-2.5 rounded-xl text-sm outline-none border transition-colors ${
    hasError
      ? "border-rose-500/50 bg-rose-500/5"
      : darkMode
      ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#31487A]/60"
      : "bg-slate-50 border-slate-200 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#31487A]/50"
  }`;

const lockedInputCls = (darkMode) =>
  `w-full px-3.5 py-2.5 rounded-xl text-sm border cursor-not-allowed ${
    darkMode
      ? "bg-white/[0.03] border-white/5 text-slate-400"
      : "bg-slate-100 border-slate-200 text-slate-500"
  }`;

export default function ProfilePage() {
  const { user, token, loading, setUser: setAuthUser } = useAuth();
  const { darkMode } = useTheme();
  const addToast = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [profileTouched, setProfileTouched] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);

  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwTouched, setPwTouched] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="pt-[88px] min-h-screen flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-slate-200 border-t-[#31487A] rounded-full animate-spin" />
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="pt-[88px] min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease }}
          className="text-center max-w-md"
        >
          <span className="text-6xl block mb-4">🔒</span>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Login Required</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Sign in to view and update your profile.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/" className="inline-block text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#31487A] no-underline">Back to Home</Link>
            <button
              type="button"
              onClick={() => navigate("/destinations")}
              className="text-white px-7 py-3 rounded-full font-semibold border-none cursor-pointer shadow-md hover:shadow-lg transition-shadow"
              style={{ background: "linear-gradient(135deg, #31487A 0%, #4B6DA8 100%)" }}
            >
              Browse Tours
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const profileErrors = {
    name: !profile.name.trim()
      ? "Name is required"
      : profile.name.trim().length < NAME_MIN
      ? `Name must be at least ${NAME_MIN} characters`
      : profile.name.trim().length > NAME_MAX
      ? `Name must be under ${NAME_MAX} characters`
      : "",
    phone: profile.phone.trim() && !PHONE_RE.test(profile.phone.trim())
      ? "Enter a valid phone number"
      : "",
  };
  const profileDirty =
    profile.name.trim() !== (user.name || "") ||
    profile.phone.trim() !== (user.phone || "");

  const pwErrors = {
    current: !pw.current ? "Enter your current password" : "",
    next: !pw.next
      ? "Enter a new password"
      : pw.next.length < PASS_MIN
      ? `New password must be at least ${PASS_MIN} characters`
      : "",
    confirm: !pw.confirm
      ? "Confirm your new password"
      : pw.confirm !== pw.next
      ? "Passwords do not match"
      : "",
  };
  const pwDirty = Boolean(pw.current || pw.next || pw.confirm);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileTouched({ name: true, phone: true });
    if (profileErrors.name || profileErrors.phone) {
      addToast("error", "Please fix the highlighted fields.");
      return;
    }
    if (!profileDirty) {
      addToast("info", "Nothing to update.");
      return;
    }
    setProfileSaving(true);
    try {
      const updated = await updateMyProfile({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
      }, token);
      if (setAuthUser) setAuthUser(updated);
      addToast("success", "Profile updated.");
    } catch (err) {
      addToast("error", err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setPwTouched({ current: true, next: true, confirm: true });
    if (pwErrors.current || pwErrors.next || pwErrors.confirm) {
      addToast("error", "Please fix the highlighted fields.");
      return;
    }
    setPwSaving(true);
    try {
      await changeMyPassword({ currentPassword: pw.current, newPassword: pw.next }, token);
      setPw({ current: "", next: "", confirm: "" });
      setPwTouched({});
      addToast("success", "Password updated.");
    } catch (err) {
      addToast("error", err.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div
      className="pt-[88px] min-h-screen bg-[#f8f6f1] dark:bg-[#192338]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[960px] mx-auto px-5 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="mb-8"
        >
          <span className="inline-block px-4 py-1 bg-[#31487A]/10 text-[#31487A] rounded-full text-[11px] font-bold tracking-wider mb-3 uppercase">
            Your Account
          </span>
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            My Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Update your personal details and keep your password fresh.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease }}
            className={`p-6 rounded-2xl border shadow-[0_4px_18px_rgba(49,72,122,0.04)] ${
              darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
            }`}
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Personal Information</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">These details show up on your booking confirmations and reviews.</p>

            <form onSubmit={handleProfileSave} className="space-y-4" noValidate>
              <Field label="Full Name" error={profileTouched.name && profileErrors.name} darkMode={darkMode}>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  onBlur={() => setProfileTouched((t) => ({ ...t, name: true }))}
                  maxLength={NAME_MAX}
                  className={inputCls(darkMode, profileTouched.name && profileErrors.name)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </Field>

              <Field label="Email Address" darkMode={darkMode} hint="Email cannot be changed">
                <div className="relative">
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    aria-readonly="true"
                    className={lockedInputCls(darkMode)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
              </Field>

              <Field label="Phone Number" error={profileTouched.phone && profileErrors.phone} darkMode={darkMode} hint="Optional — used for booking updates">
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                  onBlur={() => setProfileTouched((t) => ({ ...t, phone: true }))}
                  maxLength={20}
                  className={inputCls(darkMode, profileTouched.phone && profileErrors.phone)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  inputMode="tel"
                />
              </Field>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={profileSaving || !profileDirty}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #31487A 0%, #4B6DA8 100%)" }}
                >
                  {profileSaving ? "Saving…" : "Save Changes"}
                </button>
                <button
                  type="button"
                  disabled={profileSaving || !profileDirty}
                  onClick={() => {
                    setProfile({ name: user.name || "", email: user.email || "", phone: user.phone || "" });
                    setProfileTouched({});
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </form>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease }}
            className={`p-6 rounded-2xl border shadow-[0_4px_18px_rgba(49,72,122,0.04)] ${
              darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
            }`}
          >
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Change Password</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Use a strong, unique password to keep your account safe.</p>

            <form onSubmit={handlePasswordSave} className="space-y-4" noValidate>
              <Field label="Current Password" error={pwTouched.current && pwErrors.current} darkMode={darkMode}>
                <input
                  type="password"
                  value={pw.current}
                  onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                  onBlur={() => setPwTouched((t) => ({ ...t, current: true }))}
                  className={inputCls(darkMode, pwTouched.current && pwErrors.current)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </Field>

              <Field label="New Password" error={pwTouched.next && pwErrors.next} darkMode={darkMode} hint={`At least ${PASS_MIN} characters`}>
                <input
                  type="password"
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                  onBlur={() => setPwTouched((t) => ({ ...t, next: true }))}
                  className={inputCls(darkMode, pwTouched.next && pwErrors.next)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>

              <Field label="Confirm New Password" error={pwTouched.confirm && pwErrors.confirm} darkMode={darkMode}>
                <input
                  type="password"
                  value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                  onBlur={() => setPwTouched((t) => ({ ...t, confirm: true }))}
                  className={inputCls(darkMode, pwTouched.confirm && pwErrors.confirm)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Field>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={pwSaving || !pwDirty}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer shadow-md hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #31487A 0%, #4B6DA8 100%)" }}
                >
                  {pwSaving ? "Updating…" : "Update Password"}
                </button>
                <button
                  type="button"
                  disabled={pwSaving || !pwDirty}
                  onClick={() => {
                    setPw({ current: "", next: "", confirm: "" });
                    setPwTouched({});
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </form>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
