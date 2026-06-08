import { Router } from "express";
import destinationController from "../controllers/destinationController.js";
import auth, { adminOnly } from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  listDestinationsQuery,
  destinationBody,
  destinationPatch,
} from "../schemas/destinationSchemas.js";
import { idParam } from "../schemas/common.js";
import { writeLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.get("/", validate({ query: listDestinationsQuery }), destinationController.list);
router.get("/types", destinationController.getTypes);
router.get("/featured", destinationController.getFeatured);
router.get("/popular", destinationController.getPopular);
router.get("/:id", validate({ params: idParam }), destinationController.getById);

router.post(
  "/",
  auth,
  adminOnly,
  writeLimiter,
  validate({ body: destinationBody }),
  destinationController.create,
);

router.put(
  "/:id",
  auth,
  adminOnly,
  writeLimiter,
  validate({ params: idParam, body: destinationPatch }),
  destinationController.update,
);

router.delete(
  "/:id",
  auth,
  adminOnly,
  validate({ params: idParam }),
  destinationController.remove,
);

export default router;