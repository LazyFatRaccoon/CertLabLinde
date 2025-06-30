const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-stamp", upload.single("stamp"), async (req, res) => {
  //onst { width, height } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "Файл не знайдено" });
  }

  try {
    const outputPath = path.join(__dirname, "..", "public", "stamp.png");
    await sharp(req.file.buffer).png().toFile(outputPath);

    res.json({ message: "Печатку збережено", stampName: "stamp.png" });
  } catch (err) {
    console.error("Помилка обробки печатки:", err);
    res.status(500).json({ message: "Помилка при збереженні печатки" });
  }
});

module.exports = router;
