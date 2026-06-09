import { Router } from "express";
import * as authController from "../controllers/authController.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  optionalRefreshSchema,
  logoutSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../schemas/authSchemas.js";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimit.js";

const router = Router();

router.post("/register", authLimiter, validate({ body: registerSchema }), authController.register);
router.post("/login",    authLimiter, validate({ body: loginSchema }),    authController.login);
router.post("/refresh",  authLimiter, validate({ body: optionalRefreshSchema }), authController.refresh);
router.post("/logout",   validate({ body: logoutSchema }), authController.logout);

router.get("/me", auth, authController.getMe);
router.patch("/me", auth, validate({ body: updateProfileSchema }), authController.updateProfile);
router.patch(
  "/me/password",
  auth,
  passwordResetLimiter,
  validate({ body: changePasswordSchema }),
  authController.changePassword,
);

export default router;