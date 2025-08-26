import express from "express";
import multer from "multer";
import { transcribeAudio } from "../controllers/liveController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createMeeting, endMeeting } from "../controllers/liveController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.post("/createlive", authMiddleware, createMeeting);
router.post("/:meetingId/end", authMiddleware, endMeeting);
router.post(
  "/:roomId/recording",
  authMiddleware,
  upload.single("mixed"),
  transcribeAudio
);

export default router;
