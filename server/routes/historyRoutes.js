import express from "express";
import { addHistory, getHistory } from "../controllers/historyController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addHistory);
router.get("/", authMiddleware, getHistory);

export default router;
