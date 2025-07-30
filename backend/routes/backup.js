const express = require("express");
const router = express.Router();
const { exec } = require("child_process");

// ⚠️ Захисти токеном!
const SECRET_TOKEN = process.env.BACKUP_SECRET;

router.get("/manual", (req, res) => {
  if (req.query.token !== SECRET_TOKEN) {
    return res.status(403).send("Forbidden");
  }

  exec("bash scripts/backup.sh", (error, stdout, stderr) => {
    if (error) {
      console.error("Backup error:", error);
      return res.status(500).send("Backup failed");
    }
    console.log("Backup output:", stdout);
    res.send("Backup complete");
  });
});

module.exports = router;
