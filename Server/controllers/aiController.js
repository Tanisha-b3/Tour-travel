import * as aiService from "../services/aiService.js";
import destinationService from "../services/destinationService.js";

async function loadDestinations(limit = 80) {
  const page = await destinationService.list({ limit, sort: "rating-desc" });
  return page?.data || [];
}

function sendOk(res, data, status = 200) {
  res.status(status).json({ data });
}

function sendErr(res, err) {
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({ error: err.message || "AI request failed", code: err.code });
}

export async function status(req, res) {
  sendOk(res, aiService.getAIMeta());
}

export async function chat(req, res) {
  try {
    const ctx = { destinations: await loadDestinations(80) };
    if (req.user) ctx.user = { name: req.user.name, email: req.user.email };
    const out = await aiService.aiChat({ messages: req.body.messages, ctx });
    sendOk(res, out);
  } catch (err) {
    sendErr(res, err);
  }
}

export async function plan(req, res) {
  try {
    const destinations = await loadDestinations(80);
    const out = await aiService.aiPlan({ prefs: req.body, destinations });
    sendOk(res, out);
  } catch (err) {
    sendErr(res, err);
  }
}

export async function recommend(req, res) {
  try {
    const destinations = await loadDestinations(80);
    const out = await aiService.aiRecommend({
      prefs: req.body.prefs || {},
      destinations,
      history: req.body.history || [],
    });
    sendOk(res, out);
  } catch (err) {
    sendErr(res, err);
  }
}
