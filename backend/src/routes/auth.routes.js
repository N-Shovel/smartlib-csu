import express from "express"
import {loginController, logoutController, refreshController, signupController } from "../controller/auth.controller.js";

const router = express.Router()

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/logout", logoutController);

router.post("/refresh-token", refreshController);

export default router;
