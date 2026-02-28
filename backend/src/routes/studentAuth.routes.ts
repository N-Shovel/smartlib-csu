import express from "express"
import {loginController, logoutController, refreshController, signupController } from "../controller/studentAuth.controller.ts";

const router = express.Router()

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/logout", logoutController);

router.post("/refresh-token", refreshController);

export default router;
