import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createLibraryItemController, softDeleteItemController, getBooksController, restoreItemController, deleteItemController, requestItemController, updateItemStatusController, approveBorrowRequestController, requestReturnController, confirmReturnController } from "../controller/items.controller.js";

const router = express.Router();


/*-------------------FOR STAFF-------------------------*/

router.post("/post-items", protectRoute, createLibraryItemController);
router.post("/restore", protectRoute, restoreItemController);

router.post("/delete", protectRoute, deleteItemController);

router.patch("/soft-delete", protectRoute, softDeleteItemController);
router.patch("/update-item-status", protectRoute, updateItemStatusController);

/*-------------------FOR BOTH STAFF AND BORRWER-------------------------*/

router.get("/get-items", protectRoute, getBooksController);

/*------------------FOR BORRWER--------------------------*/

router.post("/borrow-item", protectRoute, requestItemController);
// Staff confirms borrower pickup and moves request to approved.
router.patch("/approve-borrow-request", protectRoute, approveBorrowRequestController);
// Borrower asks staff to process return for an approved borrow.
router.patch("/request-return", protectRoute, requestReturnController);
// Staff confirms return and marks item available again.
router.patch("/confirm-return", protectRoute, confirmReturnController);

export default router;

