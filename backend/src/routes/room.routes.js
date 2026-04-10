import express from "express";
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
router.post("/reservations", createReservationController);
router.get("/reservations", getReservationsController);
router.patch("/reservations/:id/cancel", cancelReservationController);

// Staff endpoints (approve, close, view history)
router.patch("/reservations/:id/approve", approveReservationController);
router.patch("/reservations/:id/close", closeReservationController);
router.get("/reservations/history", getReservationHistoryController);

export default router;
