import Booking from "../models/Booking.js";
import Destination from "../models/Destination.js";
import Testimonial from "../models/Testimonial.js";
import User from "../models/User.js";

const bookingRepository = {
  findAll() {
    return Booking.find().sort({ createdAt: -1 }).lean();
  },

  findByUser(userId) {
    return Booking.find({ user: userId }).sort({ createdAt: -1 }).lean();
  },

  findById(id) {
    return Booking.findById(id).lean();
  },

  create(data) {
    return Booking.create(data);
  },

  updateStatus(id, status) {
    return Booking.findByIdAndUpdate(id, { status }, { new: true }).lean();
  },

  countByStatus() {
    return Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  },

  recent(limit = 5) {
    return Booking.find().sort({ createdAt: -1 }).limit(limit).lean();
  },
};

export async function getDashboardStats() {
  const [destCount, testCount, userCount, bookingCount, statusAgg, revenueAgg, recentBookings] = await Promise.all([
    Destination.countDocuments(),
    Testimonial.countDocuments(),
    User.countDocuments(),
    Booking.countDocuments(),
    Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
    Booking.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);
  return {
    counts: {
      destinations: destCount,
      testimonials: testCount,
      users: userCount,
      bookings: bookingCount,
    },
    revenue: revenueAgg[0]?.total || 0,
    byStatus: statusAgg.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
    recentBookings,
  };
}

export default bookingRepository;
