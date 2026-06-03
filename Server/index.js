import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

import Destination from "./models/Destination.js";
import Testimonial from "./models/Testimonial.js";

import destinationRoutes from "./routes/destinationRoutes.js";
import testimonialRoutes from "./routes/testimonialRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";

import { readFile } from "fs/promises";

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/travel-tour";
app.get("/", (req, res) => {
  res.send("Welcome to the Travel Tour API");
});

app.use(cors({ origin: process.env.Frontend_URL || "http://localhost:5173" }));

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

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected");
    await seedIfEmpty();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use(cors());
app.use(express.json());

app.use("/api/destinations", destinationRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/bookings", bookingRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
