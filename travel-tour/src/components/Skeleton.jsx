import { motion } from "framer-motion";

const shimmer = {
  initial: { backgroundPosition: "200% 0" },
  animate: {
    backgroundPosition: "-200% 0",
    transition: { duration: 1.5, repeat: Infinity, ease: "linear" },
  },
};

/**
 * Animated shimmer skeleton block.
 * Usage: <Skeleton className="h-5 w-3/5" />
 */
export default function Skeleton({ className = "" }) {
  return (
    <motion.div
      variants={shimmer}
      initial="initial"
      animate="animate"
      aria-hidden="true"
      className={`rounded-xl skeleton-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-[#1F2D42] dark:via-[#3D5878] dark:to-[#1F2D42] ${className}`}
      style={{
        backgroundSize: "200% 100%",
      }}
    />
  );
}

/** Full destination card skeleton */
export function CardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-[#1E2E4F] rounded-2xl overflow-hidden shadow-sm"
    >
      <Skeleton className="h-[220px] rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex justify-between pt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}

/** Testimonial card skeleton */
export function TestimonialSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white dark:bg-[#1E2E4F] rounded-2xl p-7 border border-slate-100 dark:border-white/10 space-y-3"
    >
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-3 pt-2">
        <Skeleton className="w-11 h-11 rounded-full" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </motion.div>
  );
}
