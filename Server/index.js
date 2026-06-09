import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import helmet from "helmet";
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
import aiRoutes from "./routes/aiRoutes.js";
import { isAIEnabled, getAIMeta } from "./services/aiService.js";

import { readFile } from "fs/promises";
import { purgeExpiredRefreshTokens } from "./services/tokenService.js";
import cache from "./services/cacheService.js";
import auth, { adminOnly } from "./middleware/auth.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { generalLimiter, writeLimiter } from "./middleware/rateLimit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/travel-tour";
const IS_PROD = process.env.NODE_ENV === "production";

const allowedOrigins = [
  process.env.Frontend_URL,
  "http://localhost:5173",
  "http://localhost:3000",
  "https://tour-travel-eight-delta.vercel.app",
].filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.some((o) => origin === o || origin.startsWith(o))) return cb(null, true);
    return cb(null, true);
  },
  credentials: true,
  maxAge: 86400,
}));

app.use(requestId);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

app.use("/uploads", express.static(join(__dirname, "uploads"), { maxAge: "1d" }));

app.use(generalLimiter);

app.get("/", (req, res) => {
  res.send("Welcome to the Travel Tour API");
});

app.get("/healthz", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    ai: getAIMeta(),
  });
});

app.get("/api/cache/stats", auth, adminOnly, (req, res) => {
  res.json({ data: cache.snapshot() });
});

app.delete("/api/cache", auth, adminOnly, (req, res) => {
  const removed = cache.clear();
  res.json({ data: { ok: true, removed } });
});

async function seedIfEmpty() {
  try {
    const destCount = await Destination.countDocuments();
    if (destCount === 0) {
      console.log("Database empty — seeding from JSON files...");
      const destinations = JSON.parse(await readFile(new URL("./destinations.json", import.meta.url)));
      const testimonials = JSON.parse(await readFile(new URL("./testimonials.json", import.meta.url)));
      await Destination.insertMany(destinations);
      await Testimonial.insertMany(testimonials);
      console.log("Seeded successfully");
    }
  } catch (err) {
    console.error("[seed] failed:", err.message);
  }
}

mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
  .then(async () => {
    console.log("MongoDB connected");
    await seedIfEmpty();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/testimonials", testimonialRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/upload", writeLimiter, uploadRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT} (${IS_PROD ? "production" : "development"})`);
  console.log(`AI (Groq) ${isAIEnabled() ? `enabled — model: ${process.env.GROQ_MODEL || "llama-3.3-70b-versatile"}` : "disabled (set GROQ_API_KEY to enable)"}`);
  setInterval(() => {
    purgeExpiredRefreshTokens().catch((err) =>
      console.error("[token cleanup]", err.message)
    );
  }, 6 * 60 * 60 * 1000);
});

function shutdown(signal) {
  console.log(`[${signal}] shutting down…`);
  server.close(() => {
    mongoose.connection.close(false).finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

export default app;