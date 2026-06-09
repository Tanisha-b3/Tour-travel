import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchDestinations,
  fetchDestinationTypes,
  fetchMyBookings,
  aiChat,
  getAIStatus,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const ease = [0.22, 1, 0.36, 1];
const STORAGE_KEY = "tt_chat_history_v1";

const SUGGESTIONS = [
  "🏖️ Show me beach getaways under ₹25k",
  "🏛️ Best cultural destinations in India",
  "💎 Luxury escapes for couples",
  "📅 What's my latest booking?",
  "⛰️ Adventure trips for 5 days",
];

const GREETING = {
  id: "greet",
  role: "bot",
  text: "Hi! I'm your travel assistant 🌏 Ask me about destinations, prices, your bookings, or get personalized picks.",
  suggestions: SUGGESTIONS,
};

function formatINR(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function detectBudget(text) {
  const m = text.match(/(?:under|below|<|less than)\s*[₹$]?\s*(\d+(?:[.,]\d+)?)\s*k?/i);
  if (m) {
    let n = parseFloat(m[1].replace(",", "."));
    if (/k\b/i.test(text)) n *= 1000;
    return n;
  }
  const m2 = text.match(/[₹$]\s*(\d{3,})/);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

function detectType(text) {
  const t = text.toLowerCase();
  if (/beach/.test(t)) return "beach";
  if (/cultur|museum|heritage|temple|histor/.test(t)) return "cultural";
  if (/adventur|trek|hike|raft|dive/.test(t)) return "adventure";
  if (/luxur|5\s*star|premium|resort/.test(t)) return "luxury";
  return null;
}

function detectDuration(text) {
  const m = text.match(/(\d+)\s*(?:-|\s*to\s*)?\s*(\d+)?\s*day/i);
  if (m) return parseInt(m[1], 10);
  const w = text.match(/(\d+)\s*week/i);
  if (w) return parseInt(w[1], 10) * 7;
  return null;
}

function answerFromIntents(text, ctx) {
  const t = text.toLowerCase();
  const budget = detectBudget(text);
  const type = detectType(text);
  const days = detectDuration(text);
  const all = ctx.destinations;

  if (/book|booking|reservation|trip|my\s*booking/.test(t)) {
    if (!ctx.user) {
      return { text: "Please sign in to view your bookings. I can still help you explore destinations in the meantime.", cta: { label: "Sign in", to: "/login" } };
    }
    if (!ctx.bookings || ctx.bookings.length === 0) {
      return { text: "You don't have any bookings yet. Want me to suggest a destination?", suggestions: ["🏖️ Suggest a beach trip", "🏛️ Suggest a cultural trip"] };
    }
    const last = ctx.bookings[0];
    return {
      text: `Your latest booking: **${last.tourName || "Trip"}** — ${last.status} for ${last.guests || 1} guest(s), check-in ${last.checkIn || "TBD"}.`,
      cta: { label: "View all bookings", to: "/my-bookings" },
    };
  }

  if (/wishlist|saved/.test(t)) {
    return { text: "Open your wishlist to see saved destinations.", cta: { label: "Open wishlist", to: "/wishlist" } };
  }

  if (/profile|account|password|email|phone/.test(t)) {
    return { text: "Manage your account from the profile page.", cta: { label: "Open profile", to: "/profile" } };
  }

  if (/recommend|suggest|pick|where should|what about/.test(t) || budget || type || days) {
    let list = [...all];
    if (type) list = list.filter((d) => d.type === type);
    if (budget) list = list.filter((d) => (d.price || 0) <= budget);
    if (days) list = list.filter((d) => Math.abs((d.durationDays || 0) - days) <= 2);
    if (list.length === 0) list = all;
    list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const top = list.slice(0, 3);
    if (top.length === 0) {
      return { text: "I couldn't find a match. Try widening your budget or removing filters.", suggestions: SUGGESTIONS };
    }
    const filterDesc = [
      type && `type **${type}**`,
      budget && `under **${formatINR(budget)}**`,
      days && `around **${days} days**`,
    ].filter(Boolean).join(", ");
    return {
      text: `Here are my top picks${filterDesc ? ` (${filterDesc})` : ""}:`,
      destinations: top,
      suggestions: ["Show more options", "Sort by price", "Sort by rating"],
    };
  }

  if (/cheap|budget|affordable/.test(t)) {
    const cheap = [...all].sort((a, b) => (a.price || 0) - (b.price || 0)).slice(0, 3);
    return {
      text: "Most affordable options:",
      destinations: cheap,
      suggestions: ["Show me mid-range", "Show me luxury"],
    };
  }

  if (/popular|trending|top|best/.test(t)) {
    const top = [...all].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
    return {
      text: "Top-rated destinations right now:",
      destinations: top,
    };
  }

  if (/hello|hi|hey|hola/.test(t)) {
    return { text: "Hey! 👋 What kind of trip are you thinking — beach, culture, adventure, or luxury?", suggestions: SUGGESTIONS };
  }

  if (/thanks|thank you|thx/.test(t)) {
    return { text: "You're welcome! 🌴 Let me know whenever you're ready to plan.", suggestions: SUGGESTIONS };
  }

  if (/help|what can you do/.test(t)) {
    return {
      text: "I can help you with:",
      bullets: [
        "Find destinations by type, price, or duration",
        "Show your bookings and wishlist",
        "Suggest trips based on your style",
        "Take you to the planner for a full itinerary",
      ],
      suggestions: SUGGESTIONS,
    };
  }

  if (/planner|itinerary|plan/.test(t)) {
    return { text: "Open the smart trip builder to get a personalized day-by-day plan.", cta: { label: "Open planner", to: "/travel-planner" } };
  }

  if (/map|explore/.test(t)) {
    return { text: "Browse every destination on an interactive world map.", cta: { label: "Open map", to: "/explore-map" } };
  }

  if (ctx.destinations.length === 0) {
    return { text: "I'm still loading destinations — try again in a moment.", suggestions: SUGGESTIONS };
  }

  const matches = all.filter((d) =>
    [d.name, d.location, d.region, d.type, d.category]
      .filter(Boolean)
      .some((s) => s.toLowerCase().includes(t))
  );
  if (matches.length > 0) {
    return {
      text: `Found ${matches.length} destination${matches.length === 1 ? "" : "s"} matching that.`,
      destinations: matches.slice(0, 3),
    };
  }

  return {
    text: "I'm not sure I caught that. Try one of these:",
    suggestions: SUGGESTIONS,
  };
}

function renderRichText(text) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    }
    return <span key={i}>{p}</span>;
  });
}

function findMentionedDestinations(text, destinations) {
  if (!text || !destinations?.length) return [];
  const lower = text.toLowerCase();
  const hits = [];
  const seen = new Set();
  for (const d of destinations) {
    const name = d.name?.toLowerCase() || "";
    if (!name || name.length < 4) continue;
    if (lower.includes(name) && !seen.has(d.id)) {
      seen.add(d.id);
      hits.push(d);
      if (hits.length >= 3) break;
    }
  }
  return hits;
}

function MessageBubble({ msg, darkMode }) {
  const isBot = msg.role === "bot";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease }}
      className={`flex ${isBot ? "justify-start" : "justify-end"}`}
    >
      <div className={`flex gap-2 max-w-[88%] sm:max-w-[75%] ${isBot ? "" : "flex-row-reverse"}`}>
        <div
          className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${
            isBot ? "bg-[#31487A] text-white" : "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-white"
          }`}
        >
          {isBot ? "🤖" : "🧑"}
        </div>
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isBot
              ? darkMode
                ? "bg-white/5 text-slate-200 rounded-tl-sm"
                : "bg-slate-100 text-slate-800 rounded-tl-sm"
              : "bg-[#31487A] text-white rounded-tr-sm"
          }`}
        >
          <p>{renderRichText(msg.text)}</p>

          {msg.bullets && (
            <ul className="mt-2 space-y-1 text-[13px]">
              {msg.bullets.map((b, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-[#31487A]">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}

          {msg.destinations && msg.destinations.length > 0 && (
            <div className="mt-3 space-y-2">
              {msg.destinations.map((d) => (
                <Link
                  key={d.id}
                  to={`/tour/${d.id}`}
                  className={`flex gap-2.5 p-2 rounded-xl no-underline border transition-colors ${
                    darkMode ? "bg-white/5 border-white/10 hover:border-[#31487A]/60" : "bg-white border-slate-200 hover:border-[#31487A]/50"
                  }`}
                >
                  <img src={d.image} alt={d.name} loading="lazy" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{d.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{d.location} · {d.duration}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-bold text-[#31487A]">{formatINR(d.price)}</span>
                      <span className="text-[10px] text-amber-500">★ {d.rating?.toFixed?.(1) || d.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {msg.poweredBy && (
            <p className={`mt-1.5 text-[9px] font-semibold uppercase tracking-wider ${
              darkMode ? "text-slate-500" : "text-slate-400"
            }`}>
              ✦ {msg.poweredBy}
            </p>
          )}

          {msg.cta && (
            <Link
              to={msg.cta.to}
              className="inline-block mt-2 text-[11px] font-semibold text-white px-3 py-1.5 rounded-full no-underline"
              style={{ background: "linear-gradient(135deg, #31487A 0%, #4B6DA8 100%)" }}
            >
              {msg.cta.label} →
            </Link>
          )}

          {msg.suggestions && msg.suggestions.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {msg.suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent("tt-chat-suggestion", { detail: s }))}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-colors ${
                    darkMode
                      ? "border-white/10 bg-white/5 text-slate-300 hover:border-[#31487A]/60"
                      : "border-slate-200 bg-white text-slate-600 hover:border-[#31487A]/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatAssistantPage() {
  const { darkMode } = useTheme();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) return parsed;
      }
    } catch { /* noop */ }
    return [GREETING];
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [aiStatus, setAiStatus] = useState({ enabled: false, model: null });
  const scrollerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchDestinations({ limit: 100 }).then((r) => setDestinations(r.data || [])).catch(console.error);
    getAIStatus().then(setAiStatus).catch(() => setAiStatus({ enabled: false, model: null }));
  }, []);

  useEffect(() => {
    if (!token) { setBookings([]); return; }
    fetchMyBookings(token, { limit: 5 }).then((r) => setBookings(r.data || [])).catch(() => setBookings([]));
  }, [token]);

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50))); } catch { /* noop */ }
  }, [messages]);

  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const ctx = useMemo(() => ({ user, token, destinations, bookings }), [user, token, destinations, bookings]);

  const send = useCallback(async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;
    setInput("");
    const userMsg = { id: `u-${Date.now()}`, role: "user", text };
    setMessages((m) => [...m, userMsg]);
    setTyping(true);

    const chatHistory = messages
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.text)
      .slice(-10)
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

    if (aiStatus?.enabled) {
      try {
        const out = await aiChat([...chatHistory, { role: "user", content: text }], { token });
        const reply = (out?.reply || "").trim();
        const picks = findMentionedDestinations(reply, destinations);
        const botMsg = {
          id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: "bot",
          text: reply || "I didn't catch that — could you rephrase?",
          destinations: picks,
          poweredBy: out?.model ? `Groq · ${out.model}` : "Groq",
        };
        setMessages((m) => [...m, botMsg]);
        setTyping(false);
        return;
      } catch (err) {
        setMessages((m) => [...m, {
          id: `bw-${Date.now()}`,
          role: "bot",
          text: `⚠️ AI temporarily unavailable (${err.message || "network error"}). Falling back to local search.`,
        }]);
      }
    }

    setTimeout(() => {
      const reply = answerFromIntents(text, ctx);
      const botMsg = { id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, role: "bot", ...reply };
      setMessages((m) => [...m, botMsg]);
      setTyping(false);
    }, 350 + Math.random() * 250);
  }, [input, typing, ctx, messages, destinations, aiStatus, token]);

  const handleSuggestion = (s) => {
    send(s);
  };

  const clearChat = () => {
    setMessages([GREETING]);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    inputRef.current?.focus();
  };

  useEffect(() => {
    const onSuggest = (e) => handleSuggestion(e.detail);
    window.addEventListener("tt-chat-suggestion", onSuggest);
    return () => window.removeEventListener("tt-chat-suggestion", onSuggest);
  });

  return (
    <div
      className="pt-[88px] min-h-screen bg-[#f8f6f1] dark:bg-[#192338] flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${
              aiStatus?.enabled
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                : "bg-[#31487A]/10 text-[#31487A] border border-[#31487A]/20"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${aiStatus?.enabled ? "bg-emerald-500 animate-pulse" : "bg-[#31487A]"}`} />
              {aiStatus?.enabled ? "AI · Groq" : "AI Assistant"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white mt-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Travel Chat Assistant
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {aiStatus?.enabled
                ? `Powered by ${aiStatus.model || "Groq"} — answers use your live destination catalog.`
                : "Ask me anything about destinations, prices, or your trips."}
            </p>
          </div>
          <button
            type="button"
            onClick={clearChat}
            className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-500 border border-slate-200 dark:border-white/10 rounded-full px-3 py-1.5 cursor-pointer"
          >
            Clear chat
          </button>
        </div>

        <div
          ref={scrollerRef}
          className={`flex-1 overflow-y-auto rounded-2xl border p-4 sm:p-5 space-y-3 ${
            darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
          }`}
          style={{ minHeight: 360, maxHeight: "calc(100vh - 320px)" }}
        >
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble key={m.id} msg={m} darkMode={darkMode} />
            ))}
            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="flex gap-2">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-[#31487A] text-white flex items-center justify-center text-xs">🤖</div>
                  <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${darkMode ? "bg-white/5" : "bg-slate-100"}`}>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {messages.length <= 1 && (
            <div className="pt-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
                    darkMode
                      ? "border-white/10 bg-white/5 text-slate-300 hover:border-[#31487A]/60"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-[#31487A]/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className={`mt-3 flex items-end gap-2 p-2 rounded-2xl border ${
            darkMode ? "bg-[#1E2E4F] border-white/10" : "bg-white border-slate-200"
          }`}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about a destination, your bookings, or a budget…"
            rows={1}
            className={`flex-1 resize-none bg-transparent outline-none text-sm px-3 py-2.5 max-h-32 ${
              darkMode ? "text-white placeholder:text-slate-500" : "text-slate-800 placeholder:text-slate-400"
            }`}
            style={{ minHeight: 44 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || typing}
            className="shrink-0 w-11 h-11 rounded-xl text-white border-none cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #31487A 0%, #4B6DA8 100%)" }}
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.949A.75.75 0 0 0 4.42 8.7l5.788.823a.25.25 0 0 1 0 .494L4.42 10.84a.75.75 0 0 0-.727.512L2.279 16.3a.75.75 0 0 0 .95.95l14.5-5.25a.75.75 0 0 0 0-1.41L3.105 2.29Z" />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          AI responses are based on your data and our destination catalog. Always verify before booking.
        </p>
      </div>
    </div>
  );
}
