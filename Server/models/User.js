import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const refreshTokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, index: true },
    jti:       { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    userAgent: { type: String, default: "" },
    ip:        { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    revokedAt: { type: Date, default: null },
    replacedBy:{ type: String, default: null },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, select: false },
    googleId: { type: String, default: null, sparse: true },
    avatar: { type: String, default: "" },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    phone: { type: String, trim: true, default: "" },
    refreshTokens: { type: [refreshTokenSchema], select: false, default: [] },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, createdAt: -1 });

userSchema.methods.comparePassword = function (candidate) {
  if (!this.password) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.addRefreshToken = function (entry) {
  this.refreshTokens.push(entry);
  return this.save();
};

userSchema.methods.findRefreshToken = function (jti) {
  return (this.refreshTokens || []).find((t) => t.jti === jti);
};

userSchema.methods.revokeRefreshToken = function (jti, { replacedBy = null } = {}) {
  const t = (this.refreshTokens || []).find((x) => x.jti === jti);
  if (t && !t.revokedAt) {
    t.revokedAt = new Date();
    if (replacedBy) t.replacedBy = replacedBy;
  }
  return this.save();
};

userSchema.methods.revokeAllRefreshTokens = function () {
  const now = new Date();
  (this.refreshTokens || []).forEach((t) => { if (!t.revokedAt) t.revokedAt = now; });
  return this.save();
};

userSchema.methods.purgeExpiredRefreshTokens = function () {
  const now = new Date();
  this.refreshTokens = (this.refreshTokens || []).filter(
    (t) => t.expiresAt > now && (!t.revokedAt || (now - t.revokedAt) < 7 * 24 * 60 * 60 * 1000)
  );
  return this.save();
};

export default mongoose.model("User", userSchema);
