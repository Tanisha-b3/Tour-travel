import Booking from "../models/Booking.js";

const bookingRepository = {
  findAll() {
    return Booking.find().sort({ createdAt: -1 }).lean();
  },

  create(data) {
    return Booking.create(data);
  },
};

export default bookingRepository;
