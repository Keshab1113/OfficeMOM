import express from "express";
import multer from "multer";
import { transcribeAudio } from "../controllers/liveController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.post("/transcribe", upload.single("audio"), transcribeAudio);

export default router;
