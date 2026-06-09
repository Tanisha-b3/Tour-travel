import * as authService from "../services/authService.js";
import { rotateRefreshToken, revokeRefreshToken } from "../services/tokenService.js";

function metaFromReq(req) {
  return {
    userAgent: req.headers["user-agent"] || "",
    ip:
      (req.headers["x-forwarded-for"] || "")
        .toString()
        .split(",")[0]
        .trim() ||
      req.socket?.remoteAddress ||
      "",
  };
}

function pickRefreshToken(req) {
  const body = req.body?.refreshToken;
  if (body) return body;
  const cookieToken = (req.headers?.cookie || "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("refreshToken="));
  if (cookieToken) return decodeURIComponent(cookieToken.slice("refreshToken=".length));
  return null;
}

function sendOk(res, data, status = 200) {
  res.status(status).json({ data });
}

function sendErr(res, err) {
  const status = Number.isInteger(err.status) ? err.status : 500;
  res.status(status).json({ error: err.message || "Request failed" });
}

export async function register(req, res) {
  try {
    const result = await authService.register(req.body, metaFromReq(req));
    sendOk(res, result, 201);
  } catch (err) {
    sendErr(res, err);
  }
}

export async function login(req, res) {
  try {
    const result = await authService.login(req.body, metaFromReq(req));
    sendOk(res, result);
  } catch (err) {
    sendErr(res, err);
  }
}

export async function refresh(req, res) {
  try {
    const token = pickRefreshToken(req);
    if (!token) return sendErr(res, Object.assign(new Error("refreshToken is required"), { status: 400 }));
    const result = await rotateRefreshToken(token, metaFromReq(req));
    sendOk(res, result);
  } catch (err) {
    sendErr(res, err);
  }
}

export async function logout(req, res) {
  try {
    const token = pickRefreshToken(req);
    if (token) await revokeRefreshToken(token);
    sendOk(res, { ok: true });
  } catch (err) {
    sendErr(res, err);
  }
}

export async function getMe(req, res) {
  try {
    const user = await authService.getMe(req.user.id);
    sendOk(res, user);
  } catch (err) {
    sendErr(res, err);
  }
}

export async function updateProfile(req, res) {
  try {
    const user = await authService.updateProfile(req.user.id, req.body);
    sendOk(res, user);
  } catch (err) {
    sendErr(res, err);
  }
}

export async function changePassword(req, res) {
  try {
    await authService.changePassword(req.user.id, req.body);
    sendOk(res, { ok: true });
  } catch (err) {
    sendErr(res, err);
  }
}