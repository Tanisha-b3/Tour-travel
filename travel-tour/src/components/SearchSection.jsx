import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SearchIcon from "./SearchIcon";

const POPULAR_TAGS = [
  { label: "🏖️ Bali",      query: "Bali" },
  { label: "🗼 Paris",     query: "Paris" },
  { label: "🏝️ Maldives",  query: "Maldives" },
  { label: "🗾 Tokyo",     query: "Tokyo" },
  { label: "⛰️ Swiss Alps", query: "Swiss" },
  { label: "🌇 Dubai",     query: "Dubai" },
];

export default function SearchSection() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/destinations?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <section className="py-20 px-6 relative overflow-hidden" style={{
      background: "linear-gradient(135deg, #1E2E4F 0%, #31487A 50%, #31487A 100%)"
    }}>
      {/* Decorative circles */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#31487A]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-[#31487A]/20 blur-3xl pointer-events-none" />
      {/* Orange accent dot */}
      <div className="absolute top-10 right-1/4 w-4 h-4 rounded-full bg-[#31487A] opacity-60 pointer-events-none" />

      <div className="max-w-[720px] mx-auto text-center text-white relative z-10">
        <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-xs font-bold tracking-widest mb-5 uppercase">
          Search &amp; Discover
        </span>
        <h2 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">
          Where Do You Want to Go?
        </h2>
        <p className="opacity-80 mb-10 text-sm md:text-base">
          Search among hundreds of handpicked destinations and tour packages
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-[540px] mx-auto mb-8"
        >
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <SearchIcon className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <input
              type="text"
              placeholder="Search destinations, countries..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search destinations"
              className="bg-white w-full py-4 pl-11 pr-5 rounded-full border-none text-slate-800 text-sm outline-none shadow-lg"
            />
          </div>
          <button
            type="submit"
            className="bg-[#31487A] text-white px-8 py-4 rounded-full font-bold cursor-pointer hover:bg-[#31487A] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#31487A]/40 transition-all text-sm whitespace-nowrap"
          >
            Search Now
          </button>
        </form>

        <div>
          <p className="text-white/60 text-xs mb-3 uppercase tracking-wider">Popular</p>
          <div className="flex gap-2.5 justify-center flex-wrap">
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag.query}
                type="button"
                onClick={() => navigate(`/destinations?search=${tag.query}`)}
                className="px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full text-sm cursor-pointer hover:bg-white/30 transition-all border border-white/20 hover:-translate-y-0.5 font-medium"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
