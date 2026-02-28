import express from "express";
import protectRoute from "../middleware/protectRoute.ts";
import { changeEmail, changePassword, studentProfile } from "../controller/studentProfile.controller.ts";

const router = express.Router();


router.get("/student-profile", protectRoute, studentProfile);
router.post("/change-password", protectRoute, changePassword);
router.post("/change-email", protectRoute, changeEmail);

export default router;
