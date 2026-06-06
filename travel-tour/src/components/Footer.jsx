import { Link } from "react-router-dom";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim() && /\S+@\S+\.\S+/.test(email)) {
      setSubscribed(true);
      setEmail("");
    }
  };

  const quickLinks = [
    { name: "Home", to: "/" },
    { name: "Destinations", to: "/destinations" },
    { name: "Tours", to: "/tours" },
    { name: "Wishlist", to: "/wishlist" },
    { name: "Contact", to: "/" },
  ];

  const topDestinations = [
    { name: "Bali, Indonesia", id: 1 },
    { name: "Maldives", id: 3 },
    { name: "Swiss Alps", id: 5 },
    { name: "Santorini, Greece", id: 7 },
    { name: "Tokyo, Japan", id: 4 },
  ];

  return (
    <footer className="bg-black text-slate-400">
      {/* Newsletter */}
      {/* <div className="py-16 px-6" style={{ background: "linear-gradient(135deg, #1E2E4F 0%, #31487A 60%, #4f46e5 100%)" }}>
        <div className="max-w-[680px] mx-auto text-center text-white">
          <span className="text-3xl mb-3 block">✉️</span>
          <h3 className="text-2xl md:text-3xl font-extrabold mb-2">
            Get Travel Inspiration
          </h3>
          <p className="opacity-80 mb-7 text-sm">
            Subscribe for exclusive deals, destination guides, and travel tips.
          </p>
          {subscribed ? (
            <div className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-full font-semibold">
              ✅ You're subscribed! Thanks for joining.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-[460px] mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 py-3.5 px-5 rounded-full border-none text-slate-800 text-sm outline-none"
                aria-label="Newsletter email"
              />
              <button
                type="submit"
                className="py-3.5 px-7 bg-[#31487A] text-white rounded-full font-bold text-sm hover:bg-[#31487A] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#31487A]/40 transition-all cursor-pointer whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div> */}

      {/* Main */}
      <div className="max-w-[1200px] mx-auto px-6 pt-14 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 no-underline mb-4">
              <span className="text-2xl">✈️</span>
              <span className="text-xl font-extrabold text-white">Airventure</span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              We curate unforgettable travel experiences that create memories to last a lifetime. Your adventure starts here.
            </p>
            <div className="flex gap-2.5">
              {[
                { label: "Facebook", icon: "f" },
                { label: "Twitter",  icon: "𝕏" },
                { label: "Instagram",icon: "◎" },
                { label: "YouTube",  icon: "▶" },
              ].map((s) => (
                <a key={s.label} href="#" aria-label={s.label}
                  className="w-9 h-9 rounded-full bg-white/8 flex items-center justify-center text-sm text-slate-400 font-bold hover:bg-gradient-to-r hover:from-[#31487A] hover:to-[#31487A] hover:text-white hover:-translate-y-0.5 transition-all">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <Link to={item.to}
                    className="text-sm text-slate-500 no-underline hover:text-[#31487A] transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#31487A] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Top Destinations */}
          <div>
            <h4 className="text-white font-semibold mb-5">Top Destinations</h4>
            <ul className="space-y-3">
              {topDestinations.map((d) => (
                <li key={d.id}>
                  <Link to={`/tour/${d.id}`}
                    className="text-sm text-slate-500 no-underline hover:text-[#31487A] transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#31487A] opacity-0 group-hover:opacity-100 transition-opacity" />
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-5">Contact Info</h4>
            <ul className="space-y-3">
              {[
                { icon: "📍", text: "123 Travel Street, New York, USA" },
                { icon: "📞", text: "+1 (555) 123-4567" },
                { icon: "📧", text: "info@wanderlust.com" },
                { icon: "🕐", text: "Mon – Fri: 9AM – 6PM EST" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="text-base mt-0.5 shrink-0">{item.icon}</span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-white/8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
          <p>© 2026 Airventure. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((t) => (
              <a key={t} href="#" className="hover:text-[#31487A] transition-colors">{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
