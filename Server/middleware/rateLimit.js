import rateLimit from "express-rate-limit";

const make = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { error: message || "Too many requests, please slow down" },
  });

export const generalLimiter = make(15 * 60 * 1000, 300, "Too many requests from this IP, please try again later");

export const authLimiter = make(15 * 60 * 1000, 10, "Too many authentication attempts, please try again later");

export const passwordResetLimiter = make(15 * 60 * 1000, 5, "Too many password change attempts, please try again later");

export const bookingLimiter = make(10 * 60 * 1000, 20, "Too many booking submissions, please slow down");

export const writeLimiter = make(5 * 60 * 1000, 60, "Too many write operations, please slow down");

export const aiLimiter = make(60 * 1000, 20, "Too many AI requests, please slow down");

export default { generalLimiter, authLimiter, passwordResetLimiter, bookingLimiter, writeLimiter, aiLimiter };