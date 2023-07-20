import express from "express";
import {
  registerController,
  loginController,
  updateProfileController,
  testController,
  forgotPasswordController,
  verifyUserController,
  resetPasswordController,
  verifyEmailLinkController,
  verifyEmailController,
  userOrdersController,
  adminOrdersController,
  orderStatusController,
  generateOTPController,
} from "../controllers/authController.js";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";
//router object
const router = express.Router();

//Routing

//Register Route (Method POST)
router.post("/register", registerController);
//Login Route (Method POST)
router.post("/login", loginController);

//Protected routes (dashboard)
//  ->user dashboard
router.get("/user-auth", requireSignIn, (req, res) => {
  res.status(200).send({ ok: true });
});
//  ->admin dashboard
router.get("/admin-auth", requireSignIn, isAdmin, (req, res) => {
  res.status(200).send({ ok: true });
});
//update profile
router.put("/profile", updateProfileController);

//forgot password
router.post("/forgot-password", forgotPasswordController);
router.get("/reset-password/:id/:token", verifyUserController);
router.post("/reset-password/:id/:token", resetPasswordController);

//verify email
router.post("/generate-email-verify-link", verifyEmailLinkController);
router.get("/verify-email/:id/:token", verifyEmailController);

//user orders
router.get("/get-orders", requireSignIn, userOrdersController);

//admin orders
router.get("/get-admin-orders", requireSignIn, isAdmin, adminOrdersController);

// order status update
router.put(
  "/order-status/:orderId",
  requireSignIn,
  isAdmin,
  orderStatusController
);

// Verify phone
// Generate OTP
router.post("/generateOTP", generateOTPController);

//testing purpose route
router.get("/test", requireSignIn, isAdmin, testController);
export default router;
