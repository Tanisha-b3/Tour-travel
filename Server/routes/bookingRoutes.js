import { Router } from "express";
import bookingController from "../controllers/bookingController.js";
import auth, { adminOnly } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  createBookingBody,
  listBookingsQuery,
  updateBookingStatusBody,
  bookingIdParam,
} from "../schemas/bookingSchemas.js";
import { bookingLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post(
  "/",
  auth,
  bookingLimiter,
  validate({ body: createBookingBody }),
  bookingController.create,
);

router.get(
  "/mine",
  auth,
  validate({ query: listBookingsQuery }),
  bookingController.listMine,
);

router.delete(
  "/:id",
  auth,
  validate({ params: bookingIdParam }),
  bookingController.cancelMine,
);

router.get(
  "/stats",
  auth,
  adminOnly,
  bookingController.stats,
);

router.get(
  "/",
  auth,
  adminOnly,
  validate({ query: listBookingsQuery }),
  bookingController.list,
);

router.patch(
  "/:id",
  auth,
  adminOnly,
  validate({ params: bookingIdParam, body: updateBookingStatusBody }),
  bookingController.updateStatus,
);

export default router;