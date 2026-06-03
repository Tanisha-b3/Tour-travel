import { motion } from "framer-motion";

export default function TestimonialCard({ testimonial, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
      whileHover={{ y: -6, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      className="bg-white dark:bg-[#0c1a2e] rounded-2xl p-5 md:p-7 shadow-[0_4px_16px_rgba(14,165,233,0.07)] hover:shadow-[0_14px_32px_rgba(14,165,233,0.14)] transition-shadow duration-300 flex flex-col h-full border border-slate-100 dark:border-white/10"
    >
      {/* Opening quote */}
      <span className="text-5xl text-[#0ea5e9]/15 font-serif leading-none mb-2 block select-none">
        &ldquo;
      </span>

      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.4 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + i * 0.06, type: "spring", stiffness: 500 }}
            className={`text-base ${i < testimonial.rating ? "text-amber-400" : "text-slate-200"}`}
          >
            ★
          </motion.span>
        ))}
      </div>

      {/* Review text */}
      <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm mb-5 flex-1 italic">
        {testimonial.text}
      </p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
        <img
          src={testimonial.avatar}
          alt={testimonial.name}
          className="w-11 h-11 rounded-full object-cover ring-2 ring-[#0ea5e9]/25"
          loading="lazy"
        />
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">{testimonial.name}</h4>
          <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <span>📍</span>{testimonial.location}
          </span>
        </div>
      </div>
    </motion.article>
  );
}
