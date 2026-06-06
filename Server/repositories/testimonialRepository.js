import Testimonial from "../models/Testimonial.js";

const testimonialRepository = {
  findAll() {
    return Testimonial.find().sort({ createdAt: -1 }).lean();
  },

  findById(id) {
    return Testimonial.findById(id).lean();
  },

  findByUser(userId) {
    return Testimonial.find({ user: userId }).sort({ createdAt: -1 }).lean();
  },

  findByBooking(bookingId) {
    return Testimonial.findOne({ booking: bookingId }).lean();
  },

  create(data) {
    return Testimonial.create(data);
  },

  updateById(id, data) {
    return Testimonial.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
  },

  deleteById(id) {
    return Testimonial.findByIdAndDelete(id).lean();
  },
};

export default testimonialRepository;
