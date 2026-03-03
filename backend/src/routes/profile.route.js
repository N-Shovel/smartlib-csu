import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { changeEmail, changeNumber, changePassword, getStudentBorrowers, Profile } from "../controller/profile.controller.js";

const router = express.Router();


router.get("/profile", protectRoute, Profile);

router.patch("/change-password", protectRoute, changePassword);
router.patch("/change-email", protectRoute, changeEmail);
router.patch("/change-number", protectRoute, changeNumber);

router.get("/borrowers", protectRoute, getStudentBorrowers);

export default router;
