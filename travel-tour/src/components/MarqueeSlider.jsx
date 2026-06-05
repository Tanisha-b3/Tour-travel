const NAMES = [
  "Paris", "Bali", "Tokyo", "Maldives", "Switzerland",
  "Santorini", "Dubai", "New York", "Rome", "Bora Bora",
];

export default function MarqueeSlider() {
  const doubled = [...NAMES, ...NAMES];

  return (
    <div className="py-3 overflow-hidden bg-gradient-to-r from-[#1E2E4F] via-[#31487A] to-[#31487A]">
      <div className="flex gap-8 md:gap-16 animate-marquee hover:[animation-play-state:paused]">
        {doubled.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="shrink-0 text-white/90 font-extrabold text-xl md:text-2xl tracking-wide whitespace-nowrap"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
