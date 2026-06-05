import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  tourId: { type: Number, required: true },
  tourName: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
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
  status: { type: String, enum: ["confirmed", "cancelled", "pending"], default: "confirmed" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
