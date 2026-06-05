import { Router } from "express";
import destinationController from "../controllers/destinationController.js";
import auth, { adminOnly } from "../middleware/auth.js";

const router = Router();

router.get("/", destinationController.list);
router.get("/types", destinationController.getTypes);
router.get("/featured", destinationController.getFeatured);
router.get("/popular", destinationController.getPopular);
router.post("/", auth, adminOnly, destinationController.create);
router.put("/:id", auth, adminOnly, destinationController.update);
router.delete("/:id", auth, adminOnly, destinationController.remove);
router.get("/:id", destinationController.getById);

export default router;
