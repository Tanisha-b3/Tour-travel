import bookingRepository from "../repositories/bookingRepository.js";

const bookingService = {
  async list() {
    const data = await bookingRepository.findAll();
    return { count: data.length, data };
  },

  async create(body, userId) {
    const { tourId, tourName, name, email, confirmEmail, phone, address, nationality, checkIn, checkOut, guests, tripType, specialRequests, total } = body;

    if (!tourId || !name || !email || !confirmEmail || !phone || !address || !nationality || !checkIn || !checkOut || !guests || !total) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }

    if (email !== confirmEmail) {
      throw Object.assign(new Error("Emails do not match"), { status: 400 });
    }

    const data = await bookingRepository.create({
      tourId, tourName, name, email, confirmEmail, phone, address, nationality,
      checkIn, checkOut, guests: Number(guests), tripType, specialRequests, total, status: "confirmed",
      user: userId,
    });

    return { data };
  },

  async listMine(userId) {
    const data = await bookingRepository.findByUser(userId);
    return { count: data.length, data };
  },

  async updateStatus(id, status) {
    if (!["confirmed", "cancelled", "pending"].includes(status)) {
      throw Object.assign(new Error("Invalid status"), { status: 400 });
    }
    const data = await bookingRepository.updateStatus(id, status);
    if (!data) {
      throw Object.assign(new Error("Booking not found"), { status: 404 });
    }
    return { data };
  },
};

export default bookingService;
