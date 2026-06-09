import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String, default: "" },
  location: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, default: 5, min: 1, max: 5 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
  destinationId: { type: Number },
}, { timestamps: true });

testimonialSchema.index({ destinationId: 1, createdAt: -1 });
testimonialSchema.index({ user: 1, createdAt: -1 });
testimonialSchema.index({ rating: 1 });
testimonialSchema.index(
  { booking: 1 },
  { unique: true, partialFilterExpression: { booking: { $type: "objectId" } } }
);

export default mongoose.model("Testimonial", testimonialSchema);
