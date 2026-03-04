import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createLibraryItemController, softDeleteItemController, getBooksController, restoreItemController, deleteItemController, requestItemController, updateItemStatusController } from "../controller/items.controller.js";

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

export default router;

