import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createLibraryItemController, deleteItemController, getBooksController, restoreItemController } from "../controller/items.controller.js";

const router = express.Router();

router.post("/post-items", protectRoute, createLibraryItemController);
router.post("/restore", protectRoute, restoreItemController);
router.patch("/delete", protectRoute, deleteItemController);
router.get("/get-items", protectRoute, getBooksController);


export default router;

