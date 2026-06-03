

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function fetchJSON(url) {
  const res = await fetch(`${API_BASE}${url}`);
  if (!res.ok) throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  return res.json();
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

/** Submit a booking. */
export async function createBooking(payload) {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Booking failed: ${res.statusText}`);
  return res.json().then((r) => r.data);
}
