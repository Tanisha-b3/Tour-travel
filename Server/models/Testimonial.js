import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String, default: "" },
  location: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, default: 5, min: 1, max: 5 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", index: true, sparse: true },
  destinationId: { type: Number, index: true },
}, { timestamps: true });

testimonialSchema.index({ booking: 1 }, { unique: true, partialFilterExpression: { booking: { $type: "objectId" } } });

export default mongoose.model("Testimonial", testimonialSchema);
