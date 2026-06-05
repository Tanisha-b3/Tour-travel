import { Router } from "express";
import testimonialController from "../controllers/testimonialController.js";
import auth, { adminOnly } from "../middleware/auth.js";

const router = Router();

router.get("/", testimonialController.list);
router.get("/mine", auth, testimonialController.listMine);
router.post("/", auth, testimonialController.createByUser);
router.post("/admin", auth, adminOnly, testimonialController.create);
router.put("/:id", auth, adminOnly, testimonialController.update);
router.delete("/:id", auth, adminOnly, testimonialController.remove);

export default router;
