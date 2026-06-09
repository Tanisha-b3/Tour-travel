import bcrypt from "bcryptjs";
import * as userRepository from "../repositories/userRepository.js";
import { sendWelcome } from "./emailService.js";
import { issueTokensForUser } from "./tokenService.js";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role || "user",
  };
}

function resolveRole(email) {
  return ADMIN_EMAILS.includes(String(email).toLowerCase()) ? "admin" : "user";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function register({ name, email, password }, meta = {}) {
  const normalized = normalizeEmail(email);
  const existing = await userRepository.findByEmail(normalized);
  if (existing) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const role = resolveRole(normalized);
  const user = await userRepository.create({ name: String(name).trim(), email: normalized, password: hashed, role });
  const tokens = await issueTokensForUser(user, meta);

  try {
    await sendWelcome({ name: user.name, email: user.email });
  } catch (err) {
    console.error("[authService] welcome email failed:", err.message);
  }

  return { user: sanitizeUser(user), ...tokens };
}

export async function login({ email, password }, meta = {}) {
  const user = await userRepository.findByEmail(normalizeEmail(email));
  if (!user) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw Object.assign(new Error("Invalid email or password"), { status: 401 });
  }

  const tokens = await issueTokensForUser(user, meta);
  return { user: sanitizeUser(user), ...tokens };
}

export async function getMe(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  return sanitizeUser(user);
}

export async function updateProfile(userId, { name, phone }) {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  const patch = {};
  if (name !== undefined) {
    const trimmed = String(name).trim();
    if (trimmed.length < 2) {
      throw Object.assign(new Error("Name must be at least 2 characters"), { status: 400 });
    }
    if (trimmed.length > 80) {
      throw Object.assign(new Error("Name must be under 80 characters"), { status: 400 });
    }
    patch.name = trimmed;
  }
  if (phone !== undefined) {
    const trimmed = String(phone).trim();
    if (trimmed && !/^[+]?[\d\s()-]{7,20}$/.test(trimmed)) {
      throw Object.assign(new Error("Enter a valid phone number"), { status: 400 });
    }
    patch.phone = trimmed;
  }
  if (Object.keys(patch).length === 0) {
    return sanitizeUser(user);
  }
  const updated = await userRepository.updateById(userId, patch);
  return sanitizeUser(updated);
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  if (!currentPassword || !newPassword) {
    throw Object.assign(new Error("Current and new password are required"), { status: 400 });
  }
  if (String(newPassword).length < 6) {
    throw Object.assign(new Error("New password must be at least 6 characters"), { status: 400 });
  }
  const user = await userRepository.findByIdWithPassword(userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 404 });
  }
  const ok = await user.comparePassword(currentPassword);
  if (!ok) {
    throw Object.assign(new Error("Current password is incorrect"), { status: 401 });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await userRepository.setPasswordHash(userId, hashed);
  const { revokeAllForUser } = await import("./tokenService.js");
  await revokeAllForUser(userId);
  return { ok: true };
}