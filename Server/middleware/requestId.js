import crypto from "crypto";

export function requestId(req, res, next) {
  const incoming = req.headers["x-request-id"];
  const id = (typeof incoming === "string" && incoming.length > 0 && incoming.length <= 200)
    ? incoming
    : crypto.randomBytes(8).toString("hex");
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}

export default requestId;