import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema({
  destinationId: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now },
}, { _id: false });

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  items: { type: [wishlistItemSchema], default: [] },
}, { timestamps: true });

wishlistSchema.index({ "items.destinationId": 1 });

export default mongoose.model("Wishlist", wishlistSchema);
