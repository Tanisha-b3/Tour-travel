import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import Destination from "./models/Destination.js";
import Testimonial from "./models/Testimonial.js";

import destinationRoutes from "./routes/destinationRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

import { readFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/travel-tour";

const allowedOrigins = [
  process.env.Frontend_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://tour-travel-eight-delta.vercel.app",
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) return cb(null, true);
    cb(null, true);
  },
}));

app.use(express.json());

app.use("/uploads", express.static(join(__dirname, "uploads")));

async function seedIfEmpty() {
  const destCount = await Destination.countDocuments();
  if (destCount === 0) {
    console.log("Database empty — seeding from JSON files...");
    const destinations = JSON.parse(await readFile(new URL("./destinations.json", import.meta.url)));
    const testimonials = JSON.parse(await readFile(new URL("./testimonials.json", import.meta.url)));
    await Destination.insertMany(destinations);
    await Testimonial.insertMany(testimonials);
    console.log("Seeded successfully");
  }
}

app.get("/", (req, res) => {
  res.send("Welcome to the Travel Tour API");
});


app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/upload", uploadRoutes);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await seedIfEmpty();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
