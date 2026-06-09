import "dotenv/config";
import Groq from "groq-sdk";

const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const FAST_MODEL    = process.env.GROQ_FAST_MODEL || "llama-3.1-8b-instant";
const MAX_TOKENS    = Number(process.env.GROQ_MAX_TOKENS || 1024);
const TEMPERATURE   = Number(process.env.GROQ_TEMPERATURE || 0.7);
const TIMEOUT_MS    = Number(process.env.GROQ_TIMEOUT_MS || 25000);

let client = null;

function getClient() {
  if (client) return client;
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  client = new Groq({
    apiKey,
    timeout: TIMEOUT_MS,
    maxRetries: 1,
  });
  return client;
}

export function isAIEnabled() {
  return Boolean(process.env.GROQ_API_KEY);
}

export function getAIMeta() {
  return {
    enabled: isAIEnabled(),
    model: DEFAULT_MODEL,
    fastModel: FAST_MODEL,
  };
}

function safeJsonParse(text) {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)\s*```/i);
  const raw = fenced ? fenced[1] : text;
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { return null; }
    }
    return null;
  }
}

function destSnapshot(destinations = []) {
  return destinations.slice(0, 80).map((d) => ({
    id: d.id,
    name: d.name,
    location: d.location,
    type: d.type,
    duration: d.duration,
    durationDays: d.durationDays,
    price: d.price,
    rating: d.rating,
    description: (d.description || "").slice(0, 140),
    highlights: (d.highlights || []).slice(0, 4),
  }));
}

const SYSTEM_BASE = `You are a concise, friendly travel assistant for a tour-booking platform called "Venture".
You help travellers discover destinations, plan trips, check prices, and review their bookings.
Guidelines:
- Reply in the same language the user writes in.
- Be concise (1–4 short sentences for plain chat) unless a structured answer is requested.
- When suggesting destinations, use the provided catalog and reference real names + prices.
- If a user asks about their own bookings, wishlist, or account, explain that you don't have access to that data here and point them to the relevant page.
- Never invent destinations, prices, or features that aren't in the catalog.
- Format prices as ₹X,XXX (INR).`;

function buildSystemPrompt(ctx = {}) {
  const parts = [SYSTEM_BASE];
  if (Array.isArray(ctx.destinations) && ctx.destinations.length) {
    parts.push(
      `Available destination catalog (JSON):\n${JSON.stringify(destSnapshot(ctx.destinations))}\n` +
      `Only recommend from this catalog. If nothing fits, say so honestly.`
    );
  }
  if (ctx.user) {
    parts.push(`The user is signed in as ${ctx.user.name}${ctx.user.email ? ` (${ctx.user.email})` : ""}.`);
  }
  return parts.join("\n\n");
}

const PLAN_SYSTEM = `You are a travel itinerary planner. Given user preferences and a destination catalog, produce a concise, realistic day-by-day plan.
Output strict JSON only, no prose, no markdown. Schema:
{
  "picks": [{ "id": number, "reason": "1 short sentence" }],
  "itinerary": { "days": number, "summary": "1 sentence", "dayPlans": [{ "day": number, "theme": "string", "activities": ["...", "..."] }] },
  "tips": ["short tip 1", "short tip 2", "short tip 3"]
}
Rules:
- Pick destinations only from the catalog by their numeric "id".
- dayPlans length must equal "days". The first day should be arrival, the last day departure.
- Each day's activities: 3-5 concrete items (sightseeing, meals, transit).
- Keep totals realistic given the user's budget and group size.`;

export async function aiChat({ messages = [], ctx = {}, opts = {} } = {}) {
  const groq = getClient();
  if (!groq) {
    const err = new Error("AI not configured");
    err.status = 503;
    err.code = "AI_DISABLED";
    throw err;
  }
  const system = buildSystemPrompt(ctx);
  const model = opts.model || FAST_MODEL;

  const safeMessages = Array.isArray(messages) ? messages : [];
  const trimmed = safeMessages
    .filter((m) => m && (m.role === "user" || m.role === "assistant" || m.role === "system") && typeof m.content === "string")
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

  const completion = await groq.chat.completions.create({
    model,
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
    messages: [
      { role: "system", content: system },
      ...trimmed,
    ],
  });

  const reply = completion.choices?.[0]?.message?.content?.trim() || "";
  return {
    reply,
    model,
    usage: completion.usage || null,
  };
}

export async function aiPlan({ prefs = {}, destinations = [] } = {}) {
  const groq = getClient();
  if (!groq) {
    const err = new Error("AI not configured");
    err.status = 503;
    err.code = "AI_DISABLED";
    throw err;
  }
  const user = `User preferences (JSON):\n${JSON.stringify(prefs)}\n\n` +
               `Destination catalog (JSON):\n${JSON.stringify(destSnapshot(destinations))}\n\n` +
               `Generate the itinerary JSON.`;
  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.6,
    max_tokens: MAX_TOKENS,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PLAN_SYSTEM },
      { role: "user", content: user },
    ],
  });
  const text = completion.choices?.[0]?.message?.content || "";
  const parsed = safeJsonParse(text);
  if (!parsed || typeof parsed !== "object") {
    const err = new Error("AI returned an invalid itinerary");
    err.status = 502;
    err.code = "AI_BAD_RESPONSE";
    throw err;
  }
  return {
    plan: parsed,
    model: DEFAULT_MODEL,
    usage: completion.usage || null,
  };
}

const RECOMMEND_SYSTEM = `You are a travel recommender. Given user preferences and history, return 3–6 destinations from the catalog.
Output strict JSON only. Schema: { "picks": [{ "id": number, "reason": "one short sentence", "score": number (0-100) }] }
Only use numeric "id" values from the catalog. Be honest — if nothing fits, return an empty picks array.`;

export async function aiRecommend({ prefs = {}, destinations = [], history = [] } = {}) {
  const groq = getClient();
  if (!groq) {
    const err = new Error("AI not configured");
    err.status = 503;
    err.code = "AI_DISABLED";
    throw err;
  }
  const user = `User preferences (JSON):\n${JSON.stringify(prefs)}\n\n` +
               `User history — recent bookings (JSON):\n${JSON.stringify(history)}\n\n` +
               `Destination catalog (JSON):\n${JSON.stringify(destSnapshot(destinations))}\n\n` +
               `Return the picks JSON.`;
  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    temperature: 0.5,
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: RECOMMEND_SYSTEM },
      { role: "user", content: user },
    ],
  });
  const text = completion.choices?.[0]?.message?.content || "";
  const parsed = safeJsonParse(text);
  if (!parsed || !Array.isArray(parsed.picks)) {
    return { picks: [], model: DEFAULT_MODEL, usage: completion.usage || null };
  }
  return {
    picks: parsed.picks.filter((p) => Number.isFinite(p.id)).slice(0, 6),
    model: DEFAULT_MODEL,
    usage: completion.usage || null,
  };
}

export default {
  isAIEnabled,
  getAIMeta,
  aiChat,
  aiPlan,
  aiRecommend,
};
