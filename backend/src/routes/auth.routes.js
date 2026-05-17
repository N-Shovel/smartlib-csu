import express from "express"
import {forgotPasswordController, loginController, logoutController, refreshController, resetPasswordController, signupController } from "../controller/auth.controller.js";

const router = express.Router()

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/logout", logoutController);

router.post("/refresh-token", refreshController);

router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);

export default router;
