import mongoose from "mongoose";
import "dotenv/config";
import { readFile } from "fs/promises";

import Destination from "./models/Destination.js";
import Testimonial from "./models/Testimonial.js";

const destinations = JSON.parse(await readFile(new URL("./destinations.json", import.meta.url)));
const testimonials = JSON.parse(await readFile(new URL("./testimonials.json", import.meta.url)));

async function seed() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/travel-tour";
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  await Destination.deleteMany({});
  await Testimonial.deleteMany({});

  await Destination.insertMany(destinations);
  await Testimonial.insertMany(testimonials);

  const destCount = await Destination.countDocuments();
  const testCount = await Testimonial.countDocuments();
  console.log(`Seeded: ${destCount} destinations, ${testCount} testimonials`);

  await mongoose.disconnect();
  console.log("Done");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
