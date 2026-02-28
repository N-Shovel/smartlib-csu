import express, { Router } from "express"
import {loginController, logoutController, signupController } from "../controller/auth.controller.ts";

const router: Router = express.Router()

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/logout", logoutController);

export default router;
