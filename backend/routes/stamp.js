// server/routes/stamp.js
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/** абсолютна база, спільна для всіх статичних файлів */
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..");
const PUBLIC_DIR = path.join(DATA_DIR, "public"); // …/public
const STAMP_PNG = path.join(PUBLIC_DIR, "stamp.png"); // …/public/stamp.png

/** упевнюємося, що public/ існує */
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

/* POST /api/stamp/upload-stamp  —  завантажити печатку */
router.post("/upload-stamp", upload.single("stamp"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Файл не знайдено" });
    }

    await sharp(req.file.buffer).png().toFile(STAMP_PNG);
    res.json({ message: "Печатку збережено", stampName: "stamp.png" });
  } catch (e) {
    console.error("❌ upload-stamp:", e);
    res.status(500).json({ message: "Помилка при збереженні печатки" });
  }
});

module.exports = router;
