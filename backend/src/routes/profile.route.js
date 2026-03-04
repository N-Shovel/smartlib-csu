import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { changeEmail, changeNumber, changePassword, Profile } from "../controller/profile.controller.js";

const router = express.Router();


router.get("/profile", protectRoute, Profile);

router.patch("/change-password", protectRoute, changePassword);
router.patch("/change-email", protectRoute, changeEmail);
router.patch("/change-number", protectRoute, changeNumber);

export default router;
