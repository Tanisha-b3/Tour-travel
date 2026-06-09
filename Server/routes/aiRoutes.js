import { Router } from "express";
import auth from "../middleware/auth.js";
import validate  from "../middleware/validate.js";
import { aiLimiter } from "../middleware/rateLimit.js";
import { chatRequestSchema, planRequestSchema, recommendRequestSchema } from "../schemas/aiSchemas.js";
import * as aiController from "../controllers/aiController.js";

const router = Router();

router.get("/status", aiController.status);

router.post("/chat",      aiLimiter, validate({ body: chatRequestSchema }),      aiController.chat);
router.post("/plan",      aiLimiter, validate({ body: planRequestSchema }),      aiController.plan);
router.post("/recommend", auth, aiLimiter, validate({ body: recommendRequestSchema }), aiController.recommend);

export default router;
