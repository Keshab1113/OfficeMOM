import express from "express";
import multer from "multer";
import { transcribeAudio } from "../controllers/liveController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { createMeeting, endMeeting, uploadAudio, getAllAudios, deleteAudio, transcribeAudioFromURL } from "../controllers/liveController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });


router.post("/createlive", authMiddleware, createMeeting);
router.post("/:meetingId/end", authMiddleware, endMeeting);
router.post(
  "/:roomId/recording",
  authMiddleware,
  upload.single("mixed"),
  transcribeAudio
);

router.post(
  "/upload-audio",
  authMiddleware,
  upload.single("recordedAudio"),
  uploadAudio
);
router.post(
  "/upload-audio-from-url",
  authMiddleware,
  upload.single("audioUrl"),
  transcribeAudioFromURL
);

router.get("/audio-files", authMiddleware, getAllAudios);
router.delete("/audio-files/:id", authMiddleware, deleteAudio);

export default router;
