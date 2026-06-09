const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ACCESS_KEY  = "auth_token";
const REFRESH_KEY = "auth_refresh_token";

let memoryAccessToken  = null;
let memoryRefreshToken = null;
let refreshInFlight    = null;
let onSessionInvalid   = null;
let onTokenRefresh     = null;
let accessExpiresAt    = 0;

try {
  memoryAccessToken  = sessionStorage.getItem(ACCESS_KEY)  || null;
  memoryRefreshToken = sessionStorage.getItem(REFRESH_KEY) || null;
} catch { /* noop */ }

function persistAccess(token, expiresIn) {
  memoryAccessToken = token || null;
  try {
    if (token) sessionStorage.setItem(ACCESS_KEY, token);
    else       sessionStorage.removeItem(ACCESS_KEY);
  } catch { /* noop */ }
  accessExpiresAt = parseExpiry(expiresIn);
  if (onTokenRefresh) {
    try { onTokenRefresh({ accessToken: memoryAccessToken, refreshToken: memoryRefreshToken }); }
    catch { /* noop */ }
  }
}

function persistRefresh(token) {
  memoryRefreshToken = token || null;
  try {
    if (token) sessionStorage.setItem(REFRESH_KEY, token);
    else       sessionStorage.removeItem(REFRESH_KEY);
  } catch { /* noop */ }
}

function parseExpiry(exp) {
  if (!exp) return 0;
  if (typeof exp === "number") return exp;
  const m = /^(\d+)([smhd])$/.exec(String(exp));
  if (!m) return 0;
  const n = Number(m[1]);
  const unit = m[2];
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return Date.now() + n * mult;
}

export function getAccessToken()        { return memoryAccessToken; }
export function getRefreshToken()       { return memoryRefreshToken; }
export function getAccessTokenExpiry() { return accessExpiresAt; }
export function isLoggedIn()            { return Boolean(memoryAccessToken || memoryRefreshToken); }

export function setSessionInvalidHandler(fn)  { onSessionInvalid = fn; }
export function setTokenRefreshHandler(fn)    { onTokenRefresh   = fn; }

export function clearTokens() {
  persistAccess(null);
  persistRefresh(null);
  accessExpiresAt = 0;
}

async function fetchJSON(url) {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function refreshTokens() {
  if (!memoryRefreshToken) {
    throw Object.assign(new Error("No refresh token"), { status: 401 });
  }
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: memoryRefreshToken }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        clearTokens();
        if (onSessionInvalid) onSessionInvalid(json.error || "Session expired");
        throw Object.assign(new Error(json.error || "Refresh failed"), { status: res.status });
      }
      const { accessToken, refreshToken, accessTokenExpiresIn } = json.data || {};
      if (accessToken)  persistAccess(accessToken, accessTokenExpiresIn);
      if (refreshToken) persistRefresh(refreshToken);
      return json.data;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function request(path, { method = "GET", body, token, retry = true } = {}) {
  const useToken = token ?? memoryAccessToken;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(useToken),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const usingMemory = token === undefined;
  const isAuthEndpoint = path === "/auth/refresh" || path === "/auth/login" || path === "/auth/register" || path === "/auth/logout";

  if (res.status === 401 && retry && usingMemory && memoryRefreshToken && !isAuthEndpoint) {
    try {
      await refreshTokens();
      return request(path, { method, body, token: memoryAccessToken, retry: false });
    } catch {
      const json = await res.json().catch(() => ({}));
      throw Object.assign(new Error(json.error || "Request failed"), { status: 401 });
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed: ${res.status} ${res.statusText}`);
  return json;
}

export async function refreshAccessToken() {
  return refreshTokens();
}

export async function logoutRequest() {
  if (!memoryRefreshToken) {
    clearTokens();
    return { ok: true };
  }
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: memoryRefreshToken }),
    });
  } catch { /* best effort */ }
  clearTokens();
  return { ok: true };
}

/** Fetch 6 featured destinations for the homepage. */
export function fetchFeatured() {
  return fetchJSON("/destinations/featured").then((r) => r.data);
}

/** Fetch 3 popular tour packages for the homepage. */
export function fetchPopular() {
  return fetchJSON("/destinations/popular").then((r) => r.data);
}

/**
 * Fetch all destinations with optional filters.
 * @param {{ search?: string, type?: string, price?: string, rating?: string, page?: number, limit?: number }} params
 */
export function fetchDestinations(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (v === "all" && k !== "page" && k !== "limit") return;
    qs.set(k, String(v));
  });
  const query = qs.toString();
  return fetchJSON(`/destinations${query ? `?${query}` : ""}`).then((r) => r);
}

/** Fetch all distinct tour types for filter dropdowns. */
export function fetchDestinationTypes() {
  return fetchJSON("/destinations/types").then((r) => r.data);
}

/** Fetch a single destination by id. */
export function fetchDestinationById(id) {
  return fetchJSON(`/destinations/${id}`).then((r) => r.data);
}

/** Fetch all testimonials. */
export function fetchTestimonials({ page, limit } = {}) {
  const qs = new URLSearchParams();
  if (page) qs.set("page", String(page));
  if (limit) qs.set("limit", String(limit));
  const q = qs.toString();
  return fetchJSON(`/testimonials${q ? `?${q}` : ""}`).then((r) => r.data);
}

/** Fetch testimonials/reviews for a single destination (public). */
export function fetchReviewsByDestination(destinationId, { page, limit } = {}) {
  const qs = new URLSearchParams();
  if (page) qs.set("page", String(page));
  if (limit) qs.set("limit", String(limit));
  const q = qs.toString();
  return fetchJSON(`/testimonials/by-destination/${destinationId}${q ? `?${q}` : ""}`).then((r) => r.data);
}

/** Register a new user. */
export async function registerUser(payload) {
  const json = await request("/auth/register", { method: "POST", body: payload });
  const { accessToken, refreshToken, accessTokenExpiresIn, ...rest } = json.data || {};
  if (accessToken)  persistAccess(accessToken, accessTokenExpiresIn);
  if (refreshToken) persistRefresh(refreshToken);
  return rest;
}

/** Login an existing user. */
export async function loginUser(payload) {
  const json = await request("/auth/login", { method: "POST", body: payload });
  const { accessToken, refreshToken, accessTokenExpiresIn, ...rest } = json.data || {};
  if (accessToken)  persistAccess(accessToken, accessTokenExpiresIn);
  if (refreshToken) persistRefresh(refreshToken);
  return rest;
}

/** Login or register via Google OAuth. */
export async function googleLoginUser(idToken) {
  const json = await request("/auth/google", { method: "POST", body: { idToken } });
  const { accessToken, refreshToken, accessTokenExpiresIn, ...rest } = json.data || {};
  if (accessToken)  persistAccess(accessToken, accessTokenExpiresIn);
  if (refreshToken) persistRefresh(refreshToken);
  return rest;
}

/** Get current user profile (requires token). */
export async function getMe(token) {
  const json = await request("/auth/me", { token });
  return json.data;
}

/** Update current user profile (requires token). */
export async function updateMyProfile(payload, token) {
  const json = await request("/auth/me", { method: "PATCH", body: payload, token });
  return json.data;
}

/** Change current user password (requires token). */
export async function changeMyPassword(payload, token) {
  const json = await request("/auth/me/password", { method: "PATCH", body: payload, token });
  return json.data;
}

/** Submit a booking. */
export async function createBooking(payload, token) {
  const json = await request("/bookings", { method: "POST", body: payload, token });
  return json.data;
}

/* ── Authenticated user endpoints ── */
export function fetchMyBookings(token, { page, limit } = {}) {
  const qs = new URLSearchParams();
  if (page) qs.set("page", String(page));
  if (limit) qs.set("limit", String(limit));
  const q = qs.toString();
  return request(`/bookings/mine${q ? `?${q}` : ""}`, { token });
}

export function cancelMyBooking(id, token) {
  return request(`/bookings/${id}`, { method: "DELETE", token }).then((r) => r.data);
}

/* ── Admin endpoints ── */
export function fetchAdminStats(token) {
  return request("/bookings/stats", { token }).then((r) => r.data);
}

export function fetchAllBookings(token, { status, page, limit } = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (page) qs.set("page", String(page));
  if (limit) qs.set("limit", String(limit));
  const q = qs.toString();
  return request(`/bookings${q ? `?${q}` : ""}`, { token });
}

export function updateBookingStatus(id, status, token) {
  return request(`/bookings/${id}`, { method: "PATCH", body: { status }, token }).then((r) => r.data);
}

export function createDestination(payload, token) {
  return request("/destinations", { method: "POST", body: payload, token }).then((r) => r.data);
}

export function updateDestination(id, payload, token) {
  return request(`/destinations/${id}`, { method: "PUT", body: payload, token }).then((r) => r.data);
}

export function deleteDestination(id, token) {
  return request(`/destinations/${id}`, { method: "DELETE", token }).then((r) => r.data);
}

export function createTestimonial(payload, token) {
  return request("/testimonials/admin", { method: "POST", body: payload, token }).then((r) => r.data);
}

export function updateTestimonial(id, payload, token) {
  return request(`/testimonials/${id}`, { method: "PUT", body: payload, token }).then((r) => r.data);
}

export function deleteTestimonial(id, token) {
  return request(`/testimonials/${id}`, { method: "DELETE", token }).then((r) => r.data);
}

export function createUserTestimonial(payload, token) {
  return request("/testimonials", { method: "POST", body: payload, token }).then((r) => r.data);
}

export function fetchMyTestimonials(token, { page, limit } = {}) {
  const qs = new URLSearchParams();
  if (page) qs.set("page", String(page));
  if (limit) qs.set("limit", String(limit));
  const q = qs.toString();
  return request(`/testimonials/mine${q ? `?${q}` : ""}`, { token }).then((r) => r.data);
}

/* ── Wishlist endpoints (auth required) ── */
export function fetchWishlist(token) {
  return request("/wishlist", { token }).then((r) => r.data);
}

export function addWishlistItem(destinationId, token) {
  return request("/wishlist", { method: "POST", body: { destinationId }, token }).then((r) => r.data);
}

export function removeWishlistItem(destinationId, token) {
  return request(`/wishlist/${destinationId}`, { method: "DELETE", token }).then((r) => r.data);
}

export function syncWishlist(items, token) {
  return request("/wishlist/sync", { method: "POST", body: { items }, token }).then((r) => r.data);
}

/* ── File upload endpoints ── */
export async function uploadImage(file, token) {
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${API_BASE}/upload/image`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.url;
}

export async function uploadImages(files, token) {
  const fd = new FormData();
  files.forEach((f) => fd.append("images", f));
  const res = await fetch(`${API_BASE}/upload/images`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.urls;
}

/* ── AI (Groq) ── */

let aiStatusCache = null;

export async function getAIStatus() {
  if (aiStatusCache) return aiStatusCache;
  try {
    const json = await request("/ai/status");
    aiStatusCache = json.data || { enabled: false, model: null, fastModel: null };
  } catch {
    aiStatusCache = { enabled: false, model: null, fastModel: null };
  }
  return aiStatusCache;
}

export function isAIEnabledClient(status) {
  return Boolean(status && status.enabled);
}

export async function aiChat(messages, { token } = {}) {
  const json = await request("/ai/chat", { method: "POST", body: { messages }, token });
  return json.data;
}

export async function aiPlan(prefs, { token } = {}) {
  const json = await request("/ai/plan", { method: "POST", body: prefs, token });
  return json.data;
}

export async function aiRecommend(payload = {}, { token } = {}) {
  const json = await request("/ai/recommend", { method: "POST", body: payload, token });
  return json.data;
}
