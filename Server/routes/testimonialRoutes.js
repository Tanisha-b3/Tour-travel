import { Router } from "express";
import { z } from "zod";
import testimonialController from "../controllers/testimonialController.js";
import auth, { adminOnly } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  listTestimonialsQuery,
  createTestimonialBody,
  updateTestimonialBody,
} from "../schemas/testimonialSchemas.js";
import { objectId } from "../schemas/common.js";
import { writeLimiter } from "../middleware/rateLimit.js";

const router = Router();

const destIdParam = z.object({ id: z.coerce.number().int().positive() });
const mongoIdParam = z.object({ id: objectId });

router.get(
  "/",
  validate({ query: listTestimonialsQuery }),
  testimonialController.list,
);

router.get(
  "/by-destination/:id",
  validate({ params: destIdParam }),
  testimonialController.listByDestination,
);

router.get(
  "/mine",
  auth,
  validate({ query: listTestimonialsQuery }),
  testimonialController.listMine,
);

router.post(
  "/",
  auth,
  writeLimiter,
  validate({ body: createTestimonialBody }),
  testimonialController.createByUser,
);

router.post(
  "/admin",
  auth,
  adminOnly,
  writeLimiter,
  validate({ body: createTestimonialBody }),
  testimonialController.create,
);

router.put(
  "/:id",
  auth,
  adminOnly,
  writeLimiter,
  validate({ params: mongoIdParam, body: updateTestimonialBody }),
  testimonialController.update,
);

router.delete(
  "/:id",
  auth,
  adminOnly,
  validate({ params: mongoIdParam }),
  testimonialController.remove,
);

export default router;