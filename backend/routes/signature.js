const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..");
const PUBLIC_DIR = path.join(DATA_DIR, "public");

fs.mkdirSync(PUBLIC_DIR, { recursive: true });

/* конфігурація Multer */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PUBLIC_DIR),
  filename: (req, file, cb) => {
    const email = req.body.email;
    const prefix = email?.split("@")[0];
    if (!prefix) return cb(new Error("Email обов'язковий"));
    cb(null, `${prefix}Stamp.png`); //   ivanovStamp.png
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "image/png")
      return cb(new Error("Тільки PNG файли дозволені"));
    cb(null, true);
  },
});

/* POST /api/signature/upload   (body: form-data { signature:…, email:… }) */
router.post("/upload", (req, res) => {
  upload.single("signature")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: "Файл відсутній" });
    if (!req.body.email)
      return res.status(400).json({ message: "Email обов'язковий" });

    res.json({
      message: "Підпис збережено",
      filename: req.file.filename, // ivanovStamp.png
      url: `/public/${req.file.filename}`, // щоб фронт міг одразу показати
    });
  });
});

module.exports = router;
