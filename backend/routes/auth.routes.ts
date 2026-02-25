import express, { Router } from "express"
import { getProfile, loginController, logoutController, signupController } from "../controller/auth.controller.ts";
import protectRoute from "../middleware/protectRoute.ts";

const router: Router = express.Router()

router.post("/signup", signupController);
router.post("/login", loginController);
router.post("/logout", logoutController);

router.get("/profile", protectRoute, getProfile);

export default router;
