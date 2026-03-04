import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import {  getRequestHistoryController } from "../controller/history.controller.js";

const router = express.Router();

{/*========Borrower History==========*/}
router.get("/borrower-logs", protectRoute, getRequestHistoryController);

export default router;
