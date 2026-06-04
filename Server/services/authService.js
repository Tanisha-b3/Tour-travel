import jwt from "jsonwebtoken";
import * as userRepository from "../repositories/userRepository.js";

const JWT_SECRET = process.env.JWT_SECRET || "travel-tour-jwt-secret-key";

function generateToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeUser(user) {
  return { id: user._id, name: user.name, email: user.email };
}

export async function register({ name, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const user = await userRepository.create({ name, email, password });
  const token = generateToken(user._id);
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

  const token = generateToken(user._id);
  return { user: sanitizeUser(user), token };
}

export async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  return sanitizeUser(user);
}
