import Testimonial from "../models/Testimonial.js";

const testimonialRepository = {
  findAll({ skip = 0, limit = 0 } = {}) {
    const q = Testimonial.find().sort({ createdAt: -1 }).lean();
    if (skip)  q.skip(skip);
    if (limit) q.limit(limit);
    return q;
  },

  count() {
    return Testimonial.countDocuments();
  },

  findByDestination(destinationId, { skip = 0, limit = 50 } = {}) {
    const q = Testimonial.find({ destinationId: Number(destinationId) })
      .sort({ createdAt: -1 })
      .lean();
    if (skip)  q.skip(skip);
    if (limit) q.limit(limit);
    return q;
  },

  countByDestination(destinationId) {
    return Testimonial.countDocuments({ destinationId: Number(destinationId) });
  },

  findById(id) {
    return Testimonial.findById(id).lean();
  },

  findByUser(userId, { skip = 0, limit = 0 } = {}) {
    const q = Testimonial.find({ user: userId }).sort({ createdAt: -1 }).lean();
    if (skip)  q.skip(skip);
    if (limit) q.limit(limit);
    return q;
  },

  countByUser(userId) {
    return Testimonial.countDocuments({ user: userId });
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
