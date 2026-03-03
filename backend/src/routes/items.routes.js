import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createLibraryItemController, softDeleteItemController, getBooksController, restoreItemController, deleteItemController } from "../controller/items.controller.js";

const router = express.Router();

router.post("/post-items", protectRoute, createLibraryItemController);
router.post("/restore", protectRoute, restoreItemController);

router.post("/delete", protectRoute, deleteItemController);

router.patch("/soft-delete", protectRoute, softDeleteItemController);

router.get("/get-items", protectRoute, getBooksController);


export default router;

