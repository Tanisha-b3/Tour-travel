import { Router } from "express";
import bookingController from "../controllers/bookingController.js";
import auth, { adminOnly } from "../middleware/auth.js";

const router = Router();

router.post("/", auth, bookingController.create);
router.get("/mine", auth, bookingController.listMine);
router.get("/stats", auth, adminOnly, bookingController.stats);
router.get("/", auth, adminOnly, bookingController.list);
router.patch("/:id", auth, adminOnly, bookingController.updateStatus);

export default router;
