import bookingRepository from "../repositories/bookingRepository.js";
import { processTestPayment } from "./paymentService.js";
import { sendBookingConfirmation, sendBookingStatusUpdate, sendAdminBookingNotification } from "./emailService.js";
import { shapePage } from "../utils/pagination.js";

function safeEmail(booking) {
  return booking && booking.email ? String(booking.email) : "";
}

async function notifyStatusChange(booking, newStatus) {
  if (!booking) return;
  try {
    await sendBookingStatusUpdate({
      name: booking.name,
      email: safeEmail(booking),
      tourName: booking.tourName,
      status: newStatus,
      bookingId: booking._id,
    });
  } catch (err) {
    console.error("[bookingService] status email failed:", err.message);
  }
}

const bookingService = {
  async list({ page = 1, limit = 20, status } = {}) {
    const safePage  = Math.max(1, Number(page)  || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;
    const filter = {};
    if (status) filter.status = status;
    const [data, total] = await Promise.all([
      bookingRepository.findAll(filter, { skip, limit: safeLimit }),
      bookingRepository.count(filter),
    ]);
    return shapePage(data, total, safePage, safeLimit);
  },

  async create(body, userId) {
    const {
      tourId, tourName, name, email, confirmEmail, phone, address, nationality,
      checkIn, checkOut, guests, tripType, specialRequests, total, currency, payment,
    } = body || {};

    const paymentResult = processTestPayment({
      amount: total,
      currency: currency || "INR",
      card: payment && typeof payment === "object" ? payment : null,
    });

    if (!paymentResult.success) {
      throw Object.assign(new Error(paymentResult.message || "Payment failed"), { status: 402 });
    }

    const data = await bookingRepository.create({
      tourId, tourName, name, email, confirmEmail, phone, address, nationality,
      checkIn, checkOut, guests: Number(guests), tripType, specialRequests,
      total, currency: currency || "INR",
      status: "confirmed",
      paymentStatus: "paid",
      paymentId: paymentResult.paymentId,
      paymentMethod: "card",
      paymentBrand: paymentResult.brand,
      paymentLast4: paymentResult.last4,
      paidAt: paymentResult.paidAt ? new Date(paymentResult.paidAt) : new Date(),
      user: userId,
    });

    try {
      await sendBookingConfirmation({
        name: data.name,
        email: safeEmail(data),
        tourName: data.tourName,
        bookingId: data._id,
        total: data.total,
        currency: data.currency,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
        paymentStatus: data.paymentStatus,
      });
    } catch (err) {
      console.error("[bookingService] confirmation email failed:", err.message);
    }

    try {
      await sendAdminBookingNotification({
        name: data.name,
        email: safeEmail(data),
        tourName: data.tourName,
        bookingId: data._id,
        total: data.total,
        currency: data.currency,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        guests: data.guests,
      });
    } catch (err) {
      console.error("[bookingService] admin notification email failed:", err.message);
    }

    return { data };
  },

  async listMine(userId, { page = 1, limit = 20 } = {}) {
    const safePage  = Math.max(1, Number(page)  || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
    const skip = (safePage - 1) * safeLimit;
    const [data, total] = await Promise.all([
      bookingRepository.findByUser(userId, { skip, limit: safeLimit }),
      bookingRepository.count({ user: userId }),
    ]);
    return shapePage(data, total, safePage, safeLimit);
  },

  async cancelMine(userId, id) {
    const booking = await bookingRepository.findByIdAndUser(id, userId);
    if (!booking) {
      throw Object.assign(new Error("Booking not found"), { status: 404 });
    }
    if (booking.status === "cancelled") {
      return { data: booking };
    }
    const updated = await bookingRepository.setPayment(id, {
      status: "cancelled",
      paymentStatus: booking.paymentStatus === "paid" ? "refunded" : booking.paymentStatus,
    });
    await notifyStatusChange(updated || booking, "cancelled");
    return { data: updated };
  },

  async updateStatus(id, status) {
    const data = await bookingRepository.updateStatus(id, status);
    if (!data) {
      throw Object.assign(new Error("Booking not found"), { status: 404 });
    }
    await notifyStatusChange(data, status);
    return { data };
  },
};

export default bookingService;
