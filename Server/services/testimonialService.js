import testimonialRepository from "../repositories/testimonialRepository.js";
import bookingRepository from "../repositories/bookingRepository.js";
import User from "../models/User.js";
import cache, { buildKey } from "./cacheService.js";
import { shapePage } from "../utils/pagination.js";

const TTL = {
  list:      60 * 1000,
  byDest:    2 * 60 * 1000,
  mine:      30 * 1000,
};

const SCOPE_LIST   = "testimonials:list";
const SCOPE_BYDEST = "testimonials:byDest";
const SCOPE_MINE   = "testimonials:mine";

function invalidateTestimonials() {
  cache.invalidateMatching((k) => k.startsWith(`${SCOPE_LIST}:`) || k.startsWith(`${SCOPE_BYDEST}:`));
}

function clampPage(page, limit, maxLimit = 50) {
  const safePage  = Math.max(1, Number(page)  || 1);
  const safeLimit = Math.min(maxLimit, Math.max(1, Number(limit) || 12));
  return { safePage, safeLimit, skip: (safePage - 1) * safeLimit };
}

const testimonialService = {
  async list({ page = 1, limit = 12 } = {}) {
    const { safePage, safeLimit, skip } = clampPage(page, limit, 50);
    const key = buildKey(SCOPE_LIST, { page: safePage, limit: safeLimit });
    return cache.wrap(key, async () => {
      const [data, total] = await Promise.all([
        testimonialRepository.findAll({ skip, limit: safeLimit }),
        testimonialRepository.count(),
      ]);
      return shapePage(data, total, safePage, safeLimit);
    }, TTL.list);
  },

  async listByDestination(destinationId, { page = 1, limit = 12 } = {}) {
    const id = Number(destinationId);
    if (!Number.isFinite(id)) {
      throw Object.assign(new Error("Invalid destination id"), { status: 400 });
    }
    const { safePage, safeLimit, skip } = clampPage(page, limit, 50);
    const key = buildKey(SCOPE_BYDEST, { id, page: safePage, limit: safeLimit });
    return cache.wrap(key, async () => {
      const [data, total] = await Promise.all([
        testimonialRepository.findByDestination(id, { skip, limit: safeLimit }),
        testimonialRepository.countByDestination(id),
      ]);
      return shapePage(data, total, safePage, safeLimit);
    }, TTL.byDest);
  },

  async listMine(userId, { page = 1, limit = 20 } = {}) {
    const { safePage, safeLimit, skip } = clampPage(page, limit, 100);
    const key = buildKey(SCOPE_MINE, { userId: String(userId), page: safePage, limit: safeLimit });
    return cache.wrap(key, async () => {
      const [data, total] = await Promise.all([
        testimonialRepository.findByUser(userId, { skip, limit: safeLimit }),
        testimonialRepository.countByUser(userId),
      ]);
      return shapePage(data, total, safePage, safeLimit);
    }, TTL.mine);
  },

  async create(body) {
    const { name, avatar, location, text, rating } = body;

    const data = await testimonialRepository.create({ name, avatar, location, text, rating: rating ?? 5 });
    invalidateTestimonials();
    return { data };
  },

  async createByUser(userId, body) {
    const { bookingId, text, rating, location } = body;

    const r = Math.max(1, Math.min(5, Number(rating) || 5));

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw Object.assign(new Error("Booking not found"), { status: 404 });
    }
    if (!booking.user || String(booking.user) !== String(userId)) {
      throw Object.assign(new Error("You can only review your own bookings"), { status: 403 });
    }
    if (booking.status === "cancelled") {
      throw Object.assign(new Error("Cannot review a cancelled booking"), { status: 400 });
    }

    const existing = await testimonialRepository.findByBooking(bookingId);
    if (existing) {
      throw Object.assign(new Error("You already reviewed this booking"), { status: 409 });
    }

    const user = await User.findById(userId).select("name");
    if (!user) {
      throw Object.assign(new Error("User not found"), { status: 404 });
    }

    const data = await testimonialRepository.create({
      name: user.name,
      avatar: "",
      location: location || booking.nationality || "Traveler",
      text: String(text).slice(0, 1000),
      rating: r,
      user: userId,
      booking: bookingId,
      destinationId: booking.tourId,
    });
    invalidateTestimonials();
    cache.del(buildKey(SCOPE_MINE, String(userId)));
    return { data };
  },

  async update(id, body) {
    const existing = await testimonialRepository.findById(id);
    if (!existing) {
      throw Object.assign(new Error("Testimonial not found"), { status: 404 });
    }

    const allowed = ["name", "avatar", "location", "text", "rating"];
    const patch = {};
    for (const key of allowed) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    const data = await testimonialRepository.updateById(id, patch);
    invalidateTestimonials();
    return { data };
  },

  async remove(id) {
    const data = await testimonialRepository.deleteById(id);
    if (!data) {
      throw Object.assign(new Error("Testimonial not found"), { status: 404 });
    }
    invalidateTestimonials();
    return { data };
  },
};

export default testimonialService;
