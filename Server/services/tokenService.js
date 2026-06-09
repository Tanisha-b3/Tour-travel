import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

export const ACCESS_TOKEN_TTL  = process.env.ACCESS_TOKEN_TTL  || "15m";
export const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || "7d";
const REFRESH_TTL_MS = (() => {
  const m = /^(\d+)([smhd])$/.exec(String(REFRESH_TOKEN_TTL));
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const unit = m[2];
  return n * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
})();

function sha256(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function signAccessToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, type: "access" },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

function signRefreshToken(user, jti) {
  return jwt.sign(
    { id: user._id, role: user.role, type: "refresh", jti },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

export async function issueTokensForUser(user, { userAgent = "", ip = "" } = {}) {
  const jti = crypto.randomBytes(16).toString("hex");
  const refresh = signRefreshToken(user, jti);
  const access  = signAccessToken(user);
  const tokenHash = sha256(refresh);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS);

  await User.findByIdAndUpdate(user._id, {
    $push: {
      refreshTokens: {
        tokenHash,
        jti,
        expiresAt,
        userAgent: String(userAgent).slice(0, 300),
        ip: String(ip).slice(0, 80),
        createdAt: new Date(),
      },
    },
  });

  return {
    accessToken: access,
    refreshToken: refresh,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL,
    refreshTokenExpiresIn: REFRESH_TOKEN_TTL,
  };
}

export async function rotateRefreshToken(oldRefreshToken, { userAgent = "", ip = "" } = {}) {
  let decoded;
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch {
    throw Object.assign(new Error("Invalid or expired refresh token"), { status: 401 });
  }

  if (decoded.type !== "refresh") {
    throw Object.assign(new Error("Wrong token type"), { status: 401 });
  }

  const user = await User.findById(decoded.id).select("+refreshTokens");
  if (!user) {
    throw Object.assign(new Error("User not found"), { status: 401 });
  }

  const oldHash = sha256(oldRefreshToken);
  const stored = (user.refreshTokens || []).find((t) => t.jti === decoded.jti);

  if (!stored) {
    throw Object.assign(new Error("Refresh token not recognized"), { status: 401 });
  }

  if (stored.tokenHash !== oldHash) {
    await user.revokeAllRefreshTokens();
    throw Object.assign(new Error("Refresh token reuse detected — all sessions revoked"), { status: 401 });
  }

  if (stored.revokedAt) {
    if (stored.replacedBy) {
      await user.revokeAllRefreshTokens();
      throw Object.assign(new Error("Refresh token reuse detected — all sessions revoked"), { status: 401 });
    }
    throw Object.assign(new Error("Refresh token has been revoked"), { status: 401 });
  }

  if (stored.expiresAt <= new Date()) {
    throw Object.assign(new Error("Refresh token expired"), { status: 401 });
  }

  const newJti = crypto.randomBytes(16).toString("hex");
  const newRefresh = signRefreshToken(user, newJti);
  const newAccess  = signAccessToken(user);
  const newHash = sha256(newRefresh);

  stored.revokedAt = new Date();
  stored.replacedBy = newJti;

  user.refreshTokens.push({
    tokenHash: newHash,
    jti: newJti,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    userAgent: String(userAgent).slice(0, 300),
    ip: String(ip).slice(0, 80),
    createdAt: new Date(),
  });

  if (user.refreshTokens.length > 20) {
    user.refreshTokens = user.refreshTokens
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20);
  }

  await user.save();

  return {
    accessToken: newAccess,
    refreshToken: newRefresh,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL,
    refreshTokenExpiresIn: REFRESH_TOKEN_TTL,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
}

export async function revokeRefreshToken(refreshToken) {
  if (!refreshToken) return false;
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    return false;
  }
  if (decoded.type !== "refresh") return false;
  const user = await User.findById(decoded.id).select("+refreshTokens");
  if (!user) return false;
  const stored = (user.refreshTokens || []).find((t) => t.jti === decoded.jti);
  if (!stored || stored.tokenHash !== sha256(refreshToken)) return false;
  if (stored.revokedAt) return true;
  await user.revokeRefreshToken(decoded.jti);
  return true;
}

export async function revokeAllForUser(userId) {
  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) return;
  await user.revokeAllRefreshTokens();
}

export async function purgeExpiredRefreshTokens() {
  const cutoff = new Date();
  const res = await User.updateMany(
    { "refreshTokens.0": { $exists: true } },
    { $pull: { refreshTokens: { expiresAt: { $lte: cutoff } } } }
  );
  return res.modifiedCount || 0;
}
