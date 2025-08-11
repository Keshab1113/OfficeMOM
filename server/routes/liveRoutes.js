import express from "express";
import multer from "multer";
import { transcribeAudio } from "../controllers/liveController.js";
// import { transcribeAudio } from "../controllers/liveController";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// POST /api/transcribe
router.post("/transcribe", upload.single("audio"), transcribeAudio);

export default router;
