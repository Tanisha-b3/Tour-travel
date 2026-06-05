import testimonialRepository from "../repositories/testimonialRepository.js";
import bookingRepository from "../repositories/bookingRepository.js";
import User from "../models/User.js";

const testimonialService = {
  async list() {
    const data = await testimonialRepository.findAll();
    return { count: data.length, data };
  },

  async listMine(userId) {
    const data = await testimonialRepository.findByUser(userId);
    return { count: data.length, data };
  },

  async create(body) {
    const { name, avatar, location, text, rating } = body;

    if (!name || !avatar || !location || !text) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }

    const data = await testimonialRepository.create({ name, avatar, location, text, rating: rating ?? 5 });
    return { data };
  },

  async createByUser(userId, body) {
    const { bookingId, text, rating, location } = body;

    if (!bookingId || !text) {
      throw Object.assign(new Error("bookingId and text are required"), { status: 400 });
    }

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
    if (Object.keys(patch).length === 0) {
      throw Object.assign(new Error("No updatable fields supplied"), { status: 400 });
    }

    const data = await testimonialRepository.updateById(id, patch);
    return { data };
  },

  async remove(id) {
    const data = await testimonialRepository.deleteById(id);
    if (!data) {
      throw Object.assign(new Error("Testimonial not found"), { status: 404 });
    }
    return { data };
  },
};

export default testimonialService;
