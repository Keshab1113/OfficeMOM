import express from "express";
import multer from "multer";
import { processAudio } from "../controllers/audioController.js";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/process-audio", upload.single("audio"), processAudio);

export default router;
