import { Router } from "express";
import testimonialController from "../controllers/testimonialController.js";

const router = Router();

router.get("/", testimonialController.list);
router.post("/", testimonialController.create);

export default router;
