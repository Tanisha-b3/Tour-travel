export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method,
  });
}

export function errorHandler(err, req, res, _next) {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const payload = {
    error: err.expose === false || status >= 500
      ? (status >= 500 ? "Internal server error" : err.message || "Request failed")
      : err.message || "Request failed",
  };
  if (err.details) payload.details = err.details;
  if (req.id) payload.requestId = req.id;

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl} (${req.id || "—"})`, err);
  }

  if (process.env.NODE_ENV !== "production" && status >= 500) {
    payload.stack = err.stack;
  }

  res.status(status).json(payload);
}

export default errorHandler;