import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { activityLogs } from "../controller/history.controller.js";

const router = express.Router();

router.get("/recent-activity", protectRoute, activityLogs);

export default router;
