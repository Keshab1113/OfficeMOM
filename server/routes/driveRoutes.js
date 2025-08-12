import express from "express";
import multer from "multer";
import { processDrive } from "../controllers/driveController.js";

const upload = multer();
const router = express.Router();

router.post("/process-drive", upload.none(), processDrive);

export default router;
