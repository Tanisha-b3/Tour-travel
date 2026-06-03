import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String, required: true },
  location: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, required: true, default: 5 },
}, { timestamps: true });

export default mongoose.model("Testimonial", testimonialSchema);
