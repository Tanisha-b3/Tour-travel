import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
}, { _id: false });

const destinationSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  image: { type: String, required: true },
  images: [String],
  description: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true },
  durationDays: { type: Number, default: 0 },
  rating: { type: Number, required: true, default: 0 },
  category: { type: String, required: true },
  type: { type: String, required: true },
  location: { type: String, required: true },
  region: { type: String, default: "" },
  facilities: [String],
  highlights: [String],
  reviews: [reviewSchema],
}, { timestamps: true });

destinationSchema.index({ id: 1 }, { unique: true });
destinationSchema.index({ name: 1 });
destinationSchema.index({ type: 1 });
destinationSchema.index({ location: 1 });
destinationSchema.index({ region: 1 });
destinationSchema.index({ price: 1 });
destinationSchema.index({ rating: -1 });
destinationSchema.index({ durationDays: 1 });
destinationSchema.index({ createdAt: -1 });

destinationSchema.index({ type: 1, price: 1, rating: -1 });
destinationSchema.index({ type: 1, rating: -1, price: 1 });
destinationSchema.index({ price: 1, durationDays: 1 });
destinationSchema.index({ rating: -1, id: 1 });

destinationSchema.index(
  { name: "text", location: "text", description: "text", region: "text" },
  { weights: { name: 5, location: 3, region: 3, description: 1 }, name: "destination_text" }
);

export default mongoose.model("Destination", destinationSchema);
