import { AnimatePresence, motion } from "framer-motion";
import { useScrollTop } from "../hooks/useScrollTop";

export default function ScrollToTop() {
  const { visible, scrollToTop } = useScrollTop(300);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-top"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.8 }}
          whileHover={{ scale: 1.15, y: -3 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="fixed bottom-6 right-6 z-50 w-13 h-13 w-12 h-12 rounded-full bg-gradient-to-br from-[#0ea5e9] to-[#3b82f6] text-white shadow-xl shadow-[#0ea5e9]/40 flex items-center justify-center text-lg font-bold cursor-pointer"
        >
          ↑
        </motion.button>
      )}
    </AnimatePresence>
  );
}
