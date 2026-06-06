import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";

import User from "./models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/travel-tour";

const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || "Admin";
const ADMIN_EMAIL    = (process.env.SEED_ADMIN_EMAIL    || "admin@airventure.com").toLowerCase();
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@12345";

async function seedAdmin() {
  const existing = await User.findOne({ email: ADMIN_EMAIL }).select("+password");
  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

  if (existing) {
    existing.name = ADMIN_NAME;
    existing.password = hashed;
    existing.role = "admin";
    await existing.save();
    console.log(`Updated existing admin: ${ADMIN_EMAIL}`);
  } else {
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashed,
      role: "admin",
    });
    console.log(`Created admin: ${ADMIN_EMAIL}`);
  }

  console.log(`Login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected");
    try {
      await seedAdmin();
    } catch (err) {
      console.error("Seed failed:", err.message);
      process.exitCode = 1;
    } finally {
      await mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
