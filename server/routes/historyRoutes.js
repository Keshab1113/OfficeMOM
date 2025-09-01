import express from "express";
import { addHistory, getHistory, updateHistoryTitle, deleteHistory } from "../controllers/historyController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, addHistory);
router.get("/", authMiddleware, getHistory);
router.put("/:id", authMiddleware, updateHistoryTitle);
router.delete("/:id", authMiddleware, deleteHistory);

export default router;
