import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1];

function FullScreenLoader({ label = "Loading…" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-[#1E2E4F]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease }}
        className="flex flex-col items-center gap-4"
      >
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="inline-block w-10 h-10 border-[3px] border-[#31487A]/20 border-t-[#31487A] rounded-full"
        />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      </motion.div>
    </div>
  );
}

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!user || !token) {
    return <Navigate to="/" state={{ from: location.pathname, openAuth: "login" }} replace />;
  }

  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12 bg-white dark:bg-[#1E2E4F]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="text-center max-w-[480px]"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-500/15 to-rose-500/5 flex items-center justify-center text-5xl mx-auto mb-6">
            🚫
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Access Denied</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
            This area is reserved for administrators. If you believe you should have access, please contact a site admin.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#31487A] to-[#31487A] text-white px-7 py-3 rounded-full font-semibold no-underline hover:shadow-lg hover:shadow-[#31487A]/40 transition-shadow"
          >
            Back to Home
          </a>
        </motion.div>
      </div>
    );
  }

  return children;
}
