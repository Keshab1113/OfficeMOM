// const express = require("express");
// const authMiddleware = require("../middlewares/authMiddleware");
// const { uploadAudio } = require("../controllers/uploadController");
// const { uploadAudioToFTPOnly } = require("../controllers/uploadController");
// const router = express.Router();
// const multer = require("multer");
// // const upload = multer({ storage: multer.memoryStorage() });
// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 1024 * 1024 * 2000 } // 2 GB
// });


// router.post(
//   "/upload-audio",
//   authMiddleware,
//   upload.single("audio"),
//   uploadAudio
// );

// router.post(
//   "/upload-audio-ftp",
//   authMiddleware,
//   upload.single("audio"),
//   uploadAudioToFTPOnly
// );

// module.exports = router;
const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const { uploadAudio } = require("../controllers/uploadController");
const { uploadAudioToFTPOnly } = require("../controllers/uploadController");
const router = express.Router();
const multer = require("multer");

// ⚠️ Updated multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 2500 } // 2.5 GB
});

// ⚠️ ADD THIS: Timeout middleware for upload routes
const uploadTimeout = (req, res, next) => {
  req.setTimeout(7200000); // 2 hours in milliseconds
  res.setTimeout(7200000);
  console.log(`⏱️ Upload timeout set to 2 hours`);
  next();
};

// ⚠️ UPDATED: Add timeout middleware to routes
router.post(
  "/upload-audio",
  uploadTimeout,  // ADD THIS LINE
  authMiddleware,
  upload.single("audio"),
  uploadAudio
);

router.post(
  "/upload-audio-ftp",
  uploadTimeout,  // ADD THIS LINE
  authMiddleware,
  upload.single("audio"),
  uploadAudioToFTPOnly
);

module.exports = router;