import { Router } from "express";
import bookingController from "../controllers/bookingController.js";

const router = Router();

router.post("/", bookingController.create);
router.get("/", bookingController.list);

export default router;
