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
  changePassword,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  resendForgotPasswordOTP,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/login", login);
router.post("/logout", logout);

// Forgot password routes (public — user is not authenticated)
router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOTP);
router.post("/reset-password", resetPassword);
router.post("/resend-forgot-password-otp", resendForgotPasswordOTP);

router.put("/update-profile", protectRoute, updateProfile);
router.post("/change-password", protectRoute, changePassword);
router.post("/request-contact-update", protectRoute, requestContactUpdate);
router.post("/verify-contact-update", protectRoute, verifyContactUpdate);
router.get("/check", protectRoute, checkAuth);

export default router;

