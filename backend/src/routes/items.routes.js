import express from "express";
import protectRoute from "../middleware/protectRoute.js";
import { createLibraryItemController, getBooksController } from "../controller/items.routes.js";

const router = express.Router();

router.post("/post-items", protectRoute, createLibraryItemController);

router.get("/get-items", protectRoute, getBooksController);


export default router;

