const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function fetchJSON(url) {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed: ${res.status} ${res.statusText}`);
  return json;
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
 * @param {{ search?: string, type?: string, price?: string, rating?: string }} params
 */
export function fetchDestinations(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v && v !== "all") qs.set(k, v);
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
export function fetchTestimonials() {
  return fetchJSON("/testimonials").then((r) => r.data);
}

/** Register a new user. */
export async function registerUser(payload) {
  const json = await request("/auth/register", { method: "POST", body: payload });
  return json.data;
}

/** Login an existing user. */
export async function loginUser(payload) {
  const json = await request("/auth/login", { method: "POST", body: payload });
  return json.data;
}

/** Get current user profile (requires token). */
export async function getMe(token) {
  const json = await request("/auth/me", { token });
  return json.data;
}

/** Submit a booking. */
export async function createBooking(payload, token) {
  const json = await request("/bookings", { method: "POST", body: payload, token });
  return json.data;
}

/* ── Authenticated user endpoints ── */
export function fetchMyBookings(token) {
  return request("/bookings/mine", { token });
}

/* ── Admin endpoints ── */
export function fetchAdminStats(token) {
  return request("/bookings/stats", { token }).then((r) => r.data);
}

export function fetchAllBookings(token) {
  return request("/bookings", { token });
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

export function fetchMyTestimonials(token) {
  return request("/testimonials/mine", { token }).then((r) => r.data);
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
