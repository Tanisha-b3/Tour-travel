import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { fetchDestinations, fetchDestinationTypes, aiPlan, getAIStatus } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import { CardSkeleton } from "../components/Skeleton";

const ease = [0.22, 1, 0.36, 1];

const STYLES = [
  { value: "relaxed",  label: "Relaxed",      icon: "🛋️", hint: "Slow pace, plenty of downtime" },
  { value: "balanced", label: "Balanced",     icon: "⚖️", hint: "Mix of activities and rest" },
  { value: "packed",   label: "Packed",       icon: "🏃", hint: "See and do as much as possible" },
];

const INTERESTS = [
  { value: "beaches",    label: "Beaches",    icon: "🏖️" },
  { value: "culture",    label: "Culture",    icon: "🏛️" },
  { value: "adventure",  label: "Adventure",  icon: "⛰️" },
  { value: "food",       label: "Food",       icon: "🍜" },
  { value: "nightlife",  label: "Nightlife",  icon: "🌃" },
  { value: "nature",     label: "Nature",     icon: "🌿" },
  { value: "wellness",   label: "Wellness",   icon: "🧘" },
  { value: "shopping",   label: "Shopping",   icon: "🛍️" },
];

const GROUP_OPTIONS = [
  { value: 1, label: "Solo" },
  { value: 2, label: "Couple" },
  { value: 3, label: "Family" },
  { value: 4, label: "Group of 4+" },
];

const PLAN_STORAGE_KEY = "tt_planner_draft_v1";

const SEASON_HINTS = {
  "India":        { best: "Oct–Mar", avoid: "May–Jun (monsoon heat)" },
  "Indonesia":    { best: "Apr–Oct",  avoid: "Nov–Mar (rainy)" },
  "Thailand":     { best: "Nov–Feb",  avoid: "Jun–Oct (monsoon)" },
  "Japan":        { best: "Mar–May, Oct–Nov", avoid: "Jul–Aug (humid)" },
  "France":       { best: "May–Jun, Sep", avoid: "Aug (crowded)" },
  "Italy":        { best: "May, Sep",  avoid: "Aug (peak)" },
  "Greece":       { best: "May–Jun, Sep", avoid: "Aug (heat)" },
  "USA":          { best: "Apr–Jun, Sep–Oct", avoid: "Jan (winter)" },
  "UAE":          { best: "Nov–Mar",  avoid: "Jun–Aug (extreme heat)" },
  "Maldives":     { best: "Nov–Apr",  avoid: "May–Oct (rainy)" },
  "Switzerland":  { best: "Jun–Sep, Dec (ski)", avoid: "Apr–May (mud)" },
  "Nepal":        { best: "Oct–Nov, Mar–May", avoid: "Jun–Sep (monsoon)" },
  "Sri Lanka":    { best: "Dec–Mar",  avoid: "May–Aug (monsoon)" },
  "Turkey":       { best: "Apr–May, Sep–Oct", avoid: "Jul–Aug (hot)" },
  "Vietnam":      { best: "Feb–Apr, Oct–Dec", avoid: "Jun–Aug (typhoon)" },
  "Peru":         { best: "May–Sep",  avoid: "Dec–Feb (rainy)" },
};

function formatINR(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function matchSeason(country) {
  if (!country) return null;
  for (const key of Object.keys(SEASON_HINTS)) {
    if (country.toLowerCase().includes(key.toLowerCase())) return SEASON_HINTS[key];
  }
  return null;
}

function buildItinerary(destination, prefs) {
  const days = Math.max(2, Math.min(14, Math.round((prefs.durationDays || destination.durationDays || 5))));
  const pricePerDay = (destination.price || 0) / Math.max(1, destination.durationDays || 5);
  const dailyBudget = pricePerDay * prefs.guests;
  const total = dailyBudget * days;

  const dayPlans = [];
  for (let i = 1; i <= days; i++) {
    let theme, activities;
    if (i === 1) {
      theme = "Arrival & Settle In";
      activities = [
        "Airport transfer to hotel",
        "Check in and freshen up",
        "Light walk around the neighborhood",
        "Welcome dinner at a local restaurant",
      ];
    } else if (i === days) {
      theme = "Departure";
      activities = [
        "Last-minute shopping / souvenirs",
        "Hotel checkout",
        "Final meal at a favorite spot",
        "Transfer to airport",
      ];
    } else if (i === Math.ceil(days / 2)) {
      theme = `Highlight: ${destination.highlights?.[0] || "Signature Experience"}`;
      activities = [
        destination.highlights?.[0] || "Top-rated signature experience",
        destination.highlights?.[1] || "Guided local tour",
        "Sunset viewpoint visit",
        "Specialty dinner",
      ];
    } else {
      const themes = [
        { theme: "Culture & Heritage", acts: ["Old town walking tour", "Museum visit", "Local market", "Traditional performance"] },
        { theme: "Nature & Outdoors",  acts: ["Scenic hike", "Botanical garden", "River / lake visit", "Picnic lunch"] },
        { theme: "Food & Flavors",     acts: ["Cooking class", "Street food crawl", "Cafe hopping", "Wine / tea tasting"] },
        { theme: "Adventure Day",      acts: ["Water activity", "Zip-line / trek", "Sunset boat ride", "Stargazing"] },
        { theme: "Relaxation",         acts: ["Spa session", "Beach / pool time", "Leisurely brunch", "Sunset cocktails"] },
      ];
      const t = themes[(i - 2) % themes.length];
      theme = t.theme;
      activities = t.acts;
    }
    dayPlans.push({ day: i, theme, activities });
  }

  return { days, dailyBudget, total, dayPlans };
}

function rankDestinations(list, prefs) {
  if (!list.length) return [];
  const interestType = {
    beaches: "beach", culture: "cultural", adventure: "adventure", nature: "adventure",
    wellness: "luxury", shopping: "luxury", nightlife: "luxury", food: "cultural",
  };
  return list
    .map((d) => {
      let score = 0;
      const price = d.price || 0;
      if (prefs.budget && price <= prefs.budget) score += 30;
      if (prefs.budget && price <= prefs.budget * 0.7) score += 10;
      if (prefs.interest && interestType[prefs.interest] && d.type === interestType[prefs.interest]) score += 40;
      if (prefs.style === "packed" && d.durationDays >= 5) score += 10;
      if (prefs.style === "relaxed" && d.durationDays <= 4) score += 10;
      score += (d.rating || 0) * 4;
      return { d, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ d }) => d);
}

const inputCls = (dark, err) =>
  `w-full px-3.5 py-2.5 rounded-xl text-sm outline-none border transition-colors ${
    err
      ? "border-rose-500/50 bg-rose-500/5"
      : dark
      ? "bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-[#31487A]/60"
      : "bg-slate-50 border-slate-200 text-[#0a0f1e] placeholder:text-slate-400 focus:border-[#31487A]/50"
  }`;

export default function TravelPlannerPage() {
  const { darkMode } = useTheme();
  const { user, token } = useAuth();
  const addToast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(PLAN_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* noop */ }
    return {
      budget: 50000,
      durationDays: 5,
      style: "balanced",
      group: 2,
      interest: "",
      type: "",
      guests: 2,
      month: "",
    };
  });

  const [types, setTypes] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [plannerState, setPlannerState] = useState("form");
  const [picked, setPicked] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [aiStatus, setAiStatus] = useState({ enabled: false, model: null });
  const [aiPowered, setAiPowered] = useState(false);
  const [aiTips, setAiTips] = useState([]);

  useEffect(() => {
    fetchDestinationTypes().then(setTypes).catch(console.error);
    getAIStatus().then(setAiStatus).catch(() => setAiStatus({ enabled: false, model: null }));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 100 };
    if (prefs.type) params.type = prefs.type;
    fetchDestinations(params)
      .then((r) => setDestinations(r.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [prefs.type]);

  useEffect(() => {
    try { localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(prefs)); } catch { /* noop */ }
  }, [prefs]);

  const ranked = useMemo(() => rankDestinations(destinations, prefs).slice(0, 6), [destinations, prefs]);
  const season = useMemo(() => (picked ? matchSeason(picked.location) : null), [picked]);

  const setPref = (k, v) => setPrefs((p) => ({ ...p, [k]: v }));
  const next = () => setStep((s) => Math.min(s + 1, 2));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleGenerate = useCallback(async (dest) => {
    setPicked(dest);
    setItinerary(buildItinerary(dest, prefs));
    setAiPowered(false);
    setAiTips([]);
    setPlannerState("result");
    setTimeout(() => {
      document.getElementById("planner-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);

    if (aiStatus?.enabled) {
      try {
        const out = await aiPlan({
          budget: prefs.budget,
          durationDays: prefs.durationDays,
          style: prefs.style,
          group: prefs.group,
          guests: prefs.guests,
          interest: prefs.interest,
          type: prefs.type,
        }, { token });
        const plan = out?.plan;
        if (plan?.itinerary) {
          const aiItin = {
            days: plan.itinerary.days || prefs.durationDays,
            dailyBudget: ((dest.price || 0) / Math.max(1, dest.durationDays || prefs.durationDays)) * prefs.guests,
            total: (dest.price || 0) * prefs.guests,
            dayPlans: Array.isArray(plan.itinerary.dayPlans) ? plan.itinerary.dayPlans : [],
            summary: plan.itinerary.summary || "",
          };
          setItinerary(aiItin);
          setAiPowered(true);
          setAiTips(Array.isArray(plan.tips) ? plan.tips : []);
        }
      } catch (err) {
        addToast("info", `AI plan unavailable — showing local plan (${err.message || "fallback"}).`);
      }
    }
  }, [prefs, aiStatus, token, addToast]);

  const handleReset = () => {
    setPlannerState("form");
    setPicked(null);
    setItinerary(null);
    setStep(0);
  };

  const handleBook = () => {
    if (!token) {
      addToast("info", "Please sign in to book this trip.");
      navigate("/login");
      return;
    }
    if (!picked) return;
    navigate(`/book/${picked.id}`);
  };

  return (
    <div
      className="pt-[88px] min-h-screen bg-[#f8f6f1] dark:bg-[#192338]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="max-w-[1100px] mx-auto px-5 sm:px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease }}
          className="mb-8 text-center"
        >
          <span className="inline-block px-4 py-1 bg-[#31487A]/10 text-[#31487A] rounded-full text-[11px] font-bold tracking-wider mb-3 uppercase">
            Smart Trip Builder
          </span>
          <h1
            className="text-4xl sm:text-5xl font-extrabold text-slate-800 dark:text-white mb-2"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            AI Travel Planner
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
            Tell us how you like to travel — we'll match a destination and build a day-by-day plan.
          </p>
        </motion.div>

        {plannerState === "form" && (
          <div className={`p-6 sm:p-8 rounded-2xl border shadow-[0_4px_18px_rgba(49,72,122,0.04)] ${
            darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center gap-2 mb-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1">
                  <div className={`h-1 rounded-full transition-colors ${
                    step >= i ? "bg-gradient-to-r from-[#31487A] to-[#4B6DA8]" : darkMode ? "bg-white/10" : "bg-slate-200"
                  }`} />
                  <p className={`mt-1.5 text-[10px] font-semibold uppercase tracking-wider ${
                    step >= i ? "text-[#31487A]" : "text-slate-400"
                  }`}>
                    {["Budget", "Style", "Picks"][i]}
                  </p>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25, ease }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Total Budget (per person)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5000"
                        max="300000"
                        step="1000"
                        value={prefs.budget}
                        onChange={(e) => setPref("budget", Number(e.target.value))}
                        className="flex-1 accent-[#31487A]"
                      />
                      <span className="text-sm font-semibold text-[#31487A] tabular-nums w-24 text-right">
                        {formatINR(prefs.budget)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>₹5k</span><span>₹150k</span><span>₹300k</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Trip Length
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="2"
                        max="14"
                        step="1"
                        value={prefs.durationDays}
                        onChange={(e) => setPref("durationDays", Number(e.target.value))}
                        className="flex-1 accent-[#31487A]"
                      />
                      <span className="text-sm font-semibold text-[#31487A] tabular-nums w-24 text-right">
                        {prefs.durationDays} day{prefs.durationDays !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Travelling
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {GROUP_OPTIONS.map((g) => (
                        <motion.button
                          key={g.value}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => { setPref("group", g.value); setPref("guests", g.value); }}
                          className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-colors ${
                            prefs.group === g.value
                              ? "border-[#31487A] bg-[#31487A]/10 text-[#31487A]"
                              : darkMode
                              ? "border-white/10 bg-white/5 text-slate-300 hover:border-[#31487A]/40"
                              : "border-slate-200 bg-white text-slate-600 hover:border-[#31487A]/40"
                          }`}
                        >
                          {g.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={next}
                      className="text-white px-6 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                      style={{ background: "linear-gradient(135deg, #31487A 0%, #4B6DA8 100%)" }}
                    >
                      Next →
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25, ease }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Travel Style
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {STYLES.map((s) => (
                        <motion.button
                          key={s.value}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setPref("style", s.value)}
                          className={`text-left p-3 rounded-xl border transition-colors ${
                            prefs.style === s.value
                              ? "border-[#31487A] bg-[#31487A]/10"
                              : darkMode
                              ? "border-white/10 bg-white/5 hover:border-[#31487A]/40"
                              : "border-slate-200 bg-white hover:border-[#31487A]/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{s.icon}</span>
                            <span className="font-semibold text-sm text-slate-700 dark:text-white">{s.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.hint}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Primary Interest
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {INTERESTS.map((i) => (
                        <motion.button
                          key={i.value}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setPref("interest", prefs.interest === i.value ? "" : i.value)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
                            prefs.interest === i.value
                              ? "border-[#31487A] bg-[#31487A]/10 text-[#31487A]"
                              : darkMode
                              ? "border-white/10 bg-white/5 text-slate-300 hover:border-[#31487A]/40"
                              : "border-slate-200 bg-white text-slate-600 hover:border-[#31487A]/40"
                          }`}
                        >
                          <span>{i.icon}</span>
                          <span>{i.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Preferred Type <span className="text-slate-400 normal-case font-normal">(optional)</span>
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setPref("type", "")}
                        className={`py-1.5 px-3 rounded-full text-xs font-semibold border ${
                          !prefs.type
                            ? "border-[#31487A] bg-[#31487A]/10 text-[#31487A]"
                            : darkMode
                            ? "border-white/10 bg-white/5 text-slate-300"
                            : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        Any
                      </motion.button>
                      {types.map((t) => (
                        <motion.button
                          key={t}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setPref("type", prefs.type === t ? "" : t)}
                          className={`py-1.5 px-3 rounded-full text-xs font-semibold border capitalize ${
                            prefs.type === t
                              ? "border-[#31487A] bg-[#31487A]/10 text-[#31487A]"
                              : darkMode
                              ? "border-white/10 bg-white/5 text-slate-300"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {t}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button
                      type="button"
                      onClick={back}
                      className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#31487A] border-none bg-transparent cursor-pointer px-4 py-2.5"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={next}
                      className="text-white px-6 py-2.5 rounded-xl text-sm font-semibold border-none cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                      style={{ background: "linear-gradient(135deg, #31487A 0%, #4B6DA8 100%)" }}
                    >
                      See Matches →
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25, ease }}
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Top picks for {prefs.durationDays}-day {prefs.style} trip · {formatINR(prefs.budget)} budget
                    {prefs.interest && ` · ${prefs.interest}`}
                  </p>
                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} className="h-40" />)}
                    </div>
                  ) : ranked.length === 0 ? (
                    <div className="text-center py-10 text-sm text-slate-500">
                      No destinations match those filters. Try adjusting your preferences.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ranked.map((d, i) => (
                        <motion.button
                          key={d.id}
                          type="button"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05, duration: 0.3 }}
                          whileHover={{ y: -2 }}
                          onClick={() => handleGenerate(d)}
                          className={`text-left p-3 rounded-xl border flex gap-3 transition-colors ${
                            darkMode ? "bg-white/5 border-white/10 hover:border-[#31487A]/60" : "bg-slate-50 border-slate-200 hover:border-[#31487A]/50"
                          }`}
                        >
                          <img
                            src={d.image}
                            alt={d.name}
                            loading="lazy"
                            className="w-20 h-20 rounded-lg object-cover shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">{d.name}</h4>
                              <span className="text-[10px] text-slate-400">· {d.location}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 capitalize">{d.type} · {d.duration}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-sm font-bold text-[#31487A]">{formatINR(d.price)}</span>
                              <span className="text-[10px] text-amber-500">★ {d.rating?.toFixed?.(1) || d.rating}</span>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-start pt-5">
                    <button
                      type="button"
                      onClick={back}
                      className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#31487A] border-none bg-transparent cursor-pointer px-4 py-2.5"
                    >
                      ← Adjust style
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {plannerState === "result" && picked && itinerary && (
          <motion.div
            id="planner-result"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="space-y-6"
          >
            <div className={`rounded-2xl border overflow-hidden shadow-[0_4px_18px_rgba(49,72,122,0.04)] ${
              darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
            }`}>
              <div className="relative h-44 sm:h-56">
                <img src={picked.image} alt={picked.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <p className="text-[10px] uppercase tracking-widest opacity-80 mb-1">Your itinerary</p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                    {picked.name}
                  </h2>
                  <p className="text-sm opacity-90">{picked.location} · {picked.duration} · ★ {picked.rating?.toFixed?.(1) || picked.rating}</p>
                </div>
              </div>

              <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Duration</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{itinerary.days} days</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Daily Budget</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{formatINR(itinerary.dailyBudget)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Est. Total</p>
                  <p className="text-lg font-bold text-[#31487A]">{formatINR(itinerary.total)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Travellers</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-white">{prefs.guests}</p>
                </div>
              </div>

              {season && (
                <div className={`mx-5 sm:mx-6 mb-5 p-3 rounded-xl text-xs flex items-start gap-2 ${
                  darkMode ? "bg-white/5" : "bg-amber-50"
                }`}>
                  <span>🌤️</span>
                  <div className="text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-800 dark:text-white">Best season:</span> {season.best}.
                    <span className="block sm:inline sm:ml-1 text-slate-500">Avoid: {season.avoid}.</span>
                  </div>
                </div>
              )}
            </div>

            <div className={`rounded-2xl border p-5 sm:p-6 shadow-[0_4px_18px_rgba(49,72,122,0.04)] ${
              darkMode ? "bg-[#1E2E4F] border-white/5" : "bg-white border-slate-200"
            }`}>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Day-by-day plan</h3>
              <ol className="space-y-4">
                {itinerary.dayPlans.map((d) => (
                  <li key={d.day} className="flex gap-3">
                    <div className="shrink-0 w-9 h-9 rounded-full bg-[#31487A]/10 text-[#31487A] flex items-center justify-center text-xs font-bold">
                      D{d.day}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white">{d.theme}</h4>
                      <ul className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {d.activities.map((a, i) => (
                          <li key={i} className="flex gap-1.5">
                            <span className="text-[#31487A]">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleBook}
                className="flex-1 text-white px-6 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer shadow-md hover:shadow-lg transition-shadow"
                style={{ background: "linear-gradient(135deg, #31487A 0%, #4B6DA8 100%)" }}
              >
                Book this trip
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                Plan another
              </button>
              <Link
                to={`/tour/${picked.id}`}
                className="px-6 py-3 rounded-xl text-sm font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors no-underline text-center"
              >
                View tour →
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
