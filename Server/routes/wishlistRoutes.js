import { Router } from "express";
import auth from "../middleware/auth.js";
import wishlistController from "../controllers/wishlistController.js";

const router = Router();

router.use(auth);

router.get("/", wishlistController.list);
router.post("/", wishlistController.add);
router.post("/sync", wishlistController.sync);
router.delete("/:destinationId", wishlistController.remove);

export default router;
