import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  tourId: { type: Number, required: true, index: true },
  tourName: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  confirmEmail: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  nationality: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  guests: { type: Number, required: true, min: 1 },
  tripType: { type: String, default: "couple" },
  specialRequests: { type: String, default: "" },
  total: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["confirmed", "cancelled", "pending"], default: "confirmed", index: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "refunded", "failed"], default: "pending", index: true },
  paymentId: { type: String, default: "" },
  paymentMethod: { type: String, default: "" },
  paymentBrand: { type: String, default: "" },
  paymentLast4: { type: String, default: "" },
  paidAt: { type: Date },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
}, { timestamps: true });

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ user: 1, status: 1, createdAt: -1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ paymentStatus: 1, createdAt: -1 });
bookingSchema.index({ tourId: 1, createdAt: -1 });

export default mongoose.model("Booking", bookingSchema);
