import { Router } from "express";
import destinationController from "../controllers/destinationController.js";

const router = Router();

router.get("/", destinationController.list);
router.get("/types", destinationController.getTypes);
router.get("/featured", destinationController.getFeatured);
router.get("/popular", destinationController.getPopular);
router.post("/", destinationController.create);
router.get("/:id", destinationController.getById);

export default router;
