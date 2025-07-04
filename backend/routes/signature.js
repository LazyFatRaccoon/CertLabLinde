const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "public"));
  },
  filename: (req, file, cb) => {
    const email = req.body.email;
    const emailPrefix = email?.split("@")[0];
    if (!emailPrefix) return cb(new Error("Email обов'язковий"));
    cb(null, `${emailPrefix}Stamp.png`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "image/png") {
      return cb(new Error("Тільки PNG файли дозволені"));
    }
    cb(null, true);
  },
});

router.post("/upload-signature", (req, res) => {
  upload.single("signature")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file || !req.body.email) {
      return res.status(400).json({ message: "Missing file or email" });
    }
    res.json({ message: "Підпис збережено", filename: req.file.filename });
  });
});

module.exports = router;
