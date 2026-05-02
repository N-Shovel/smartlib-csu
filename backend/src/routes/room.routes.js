import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import {
    createReservationController,
    getReservationsController,
    approveReservationController,
    closeReservationController,
    cancelReservationController,
    getReservationHistoryController,
} from "../controller/room.controller.js";

const router = express.Router();

// Borrower endpoints (student creates and cancels)
router.post("/reservations", protectRoute, createReservationController);
router.get("/reservations", protectRoute, getReservationsController);
router.patch("/reservations/:id/cancel", protectRoute, cancelReservationController);

// Staff endpoints (approve, close, view history)
router.patch("/reservations/:id/approve", protectRoute, approveReservationController);
router.patch("/reservations/:id/close", protectRoute, closeReservationController);
router.get("/reservations/history", protectRoute, getReservationHistoryController);

export default router;
