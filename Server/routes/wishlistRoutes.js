import { Router } from "express";
import auth from "../middleware/auth.js";
import wishlistController from "../controllers/wishlistController.js";
import validate from "../middleware/validate.js";
import {
  wishlistAddBody,
  wishlistSyncBody,
  wishlistIdParam,
} from "../schemas/wishlistSchemas.js";

const router = Router();

router.use(auth);

router.get("/", wishlistController.list);
router.post("/", validate({ body: wishlistAddBody }), wishlistController.add);
router.post("/sync", validate({ body: wishlistSyncBody }), wishlistController.sync);
router.delete(
  "/:destinationId",
  validate({ params: wishlistIdParam }),
  wishlistController.remove,
);

export default router;