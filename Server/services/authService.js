import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import * as userRepository from "../repositories/userRepository.js";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function generateToken(userId, role) {
  return jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role || "user" };
}

function resolveRole(email) {
  return ADMIN_EMAILS.includes(String(email).toLowerCase()) ? "admin" : "user";
}

export async function register({ name, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const role = resolveRole(email);
  const user = await userRepository.create({ name, email, password: hashed, role });
  const token = generateToken(user._id, role);
  return { user: sanitizeUser(user), token };
}

export async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const token = generateToken(user._id, user.role || "user");
  return { user: sanitizeUser(user), token };
}

export async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  return sanitizeUser(user);
}
