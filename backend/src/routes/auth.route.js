import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
  checkAuth,
  verifyOTP,
  resendOTP,
  requestContactUpdate,
  verifyContactUpdate,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);
router.post("/request-contact-update", protectRoute, requestContactUpdate);
router.post("/verify-contact-update", protectRoute, verifyContactUpdate);
router.get("/check", protectRoute, checkAuth);

export default router;
