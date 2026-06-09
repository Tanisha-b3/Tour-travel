import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(status, message, { details, cause } = {}) {
    super(message);
    this.status = status;
    this.details = details;
    if (cause) this.cause = cause;
  }
}

function formatZodError(err) {
  if (err instanceof ZodError) {
    return {
      error: "Validation failed",
      details: err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
        code: i.code,
      })),
    };
  }
  return { error: err.message || "Invalid request" };
}

function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body)   req.body   = schemas.body.parse(req.body   || {});
      if (schemas.query)  req.query  = schemas.query.parse(req.query  || {});
      if (schemas.params) req.params = schemas.params.parse(req.params || {});
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(formatZodError(err));
      }
      next(err);
    }
  };
}

export default validate;
export { formatZodError };