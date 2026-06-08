import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export default async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = header.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type && decoded.type !== "access") {
      return res.status(401).json({ error: "Wrong token type" });
    }
    const user = await User.findById(decoded.id).select("role");
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = { id: user._id, role: user.role };
    next();
  } catch (err) {
    const isExpired = err && err.name === "TokenExpiredError";
    return res.status(401).json({ error: isExpired ? "Access token expired" : "Invalid token" });
  }
}

export function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
