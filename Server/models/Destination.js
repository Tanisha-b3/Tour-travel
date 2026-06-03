import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
}, { _id: false });

const destinationSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, index: true },
  image: { type: String, required: true },
  images: [String],
  description: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true },
  rating: { type: Number, required: true, default: 0 },
  category: { type: String, required: true },
  type: { type: String, required: true, index: true },
  location: { type: String, required: true, index: true },
  facilities: [String],
  highlights: [String],
  reviews: [reviewSchema],
}, { timestamps: true });

destinationSchema.index({ name: "text", location: "text", description: "text" });

export default mongoose.model("Destination", destinationSchema);
