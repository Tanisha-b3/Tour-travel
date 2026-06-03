import bookingRepository from "../repositories/bookingRepository.js";

const bookingService = {
  async list() {
    const data = await bookingRepository.findAll();
    return { count: data.length, data };
  },

  async create(body) {
    const { tourId, tourName, name, email, phone, checkIn, checkOut, guests, specialRequests, total } = body;

    if (!tourId || !name || !email || !phone || !checkIn || !checkOut || !guests || !total) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }

    const data = await bookingRepository.create({
      tourId, tourName, name, email, phone, checkIn, checkOut,
      guests: Number(guests), specialRequests, total, status: "confirmed",
    });

    return { data };
  },
};

export default bookingService;
