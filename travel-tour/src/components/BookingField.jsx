import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// interface BookingFieldProps {
//   icon: React.ReactNode;
//   label: string;
//   placeholder: string;
//   value: string;
//   onChange: (v: string) => void;
//   type?: string;
//   divider?: boolean;
//   error?: string;
//   required?: boolean;
//   disabled?: boolean;
//   onFocus?: () => void;
//   onBlur?: () => void;
// }

export default function BookingField({
  icon,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  divider = true,
  error,
  required = false,
  disabled = false,
  onFocus,
  onBlur,
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    setIsTouched(true);
    onBlur?.();
  };

  const hasError = error && isTouched;
  const isValid = isTouched && !error && value;

  return (
    <div className="relative group">
      <motion.div
        initial={false}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={`
          flex-1 flex items-center gap-3 px-5 py-4 relative min-w-0
          transition-all duration-200
          ${divider ? "border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50" : "hover:bg-gray-50/50 dark:hover:bg-gray-800/30"}
          ${hasError ? "bg-red-50/50 dark:bg-red-500/5" : ""}
          ${isValid ? "bg-emerald-50/30 dark:bg-emerald-500/5" : ""}
        `}
      >
        {/* Icon with enhanced styling */}
        <div className={`
          flex-shrink-0 transition-all duration-200
          ${isFocused ? "text-blue-500 scale-110" : "text-blue-400 group-hover:text-blue-500"}
          ${hasError ? "text-red-500" : ""}
          ${isValid ? "text-emerald-500" : ""}
        `}>
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          {/* Label with required indicator */}
          <div className="flex items-center gap-1 mb-0.5">
            <p
              className={`
                text-[10px] font-semibold uppercase tracking-widest transition-colors duration-200
                ${isFocused ? "text-blue-500" : hasError ? "text-red-500" : isValid ? "text-emerald-500" : "text-gray-400"}
              `}
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {label}
            </p>
            {required && !value && (
              <span className="text-red-400 text-[10px] font-bold">*</span>
            )}
          </div>

          {/* Input with enhanced styling */}
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`
              w-full text-sm font-medium bg-transparent outline-none transition-all duration-200
              placeholder-gray-400 dark:placeholder-gray-500
              disabled:cursor-not-allowed
              ${hasError ? "text-red-600 dark:text-red-400" : ""}
              ${isValid ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-200"}
            `}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />

          {/* Character count for text fields */}
          {type === "text" && value && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute right-3 bottom-1 text-[10px] text-gray-400"
            >
              {value.length}
            </motion.span>
          )}
        </div>

        {/* Status indicator */}
        <AnimatePresence>
          {(hasError || isValid) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex-shrink-0"
            >
              {hasError ? (
                <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              ) : isValid ? (
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                </svg>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated focus ring */}
        <AnimatePresence>
          {isFocused && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0, scaleX: 0 }}
              className="absolute inset-0 pointer-events-none"
            >
              <div className="absolute inset-0 rounded-lg ring-2 ring-blue-400/50" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {hasError && error && (
          <motion.p
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-red-500 mt-1 px-4 flex items-center gap-1 overflow-hidden"
          >
            <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Success message hint */}
      <AnimatePresence>
        {isValid && !error && value && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[10px] text-emerald-500 mt-0.5 px-4"
          >
            ✓ Valid {label.toLowerCase()}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
