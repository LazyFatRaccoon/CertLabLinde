const express = require("express");
const router = express.Router();

const { User, UserLog } = require("../models");
const authenticateToken = require("../middleware/authenticate");
const onlySupervisors = require("../middleware/onlySupervisors");

/* ============================================================
 * POST /api/logs/users   —  створити запис журналу
 * ========================================================== */
router.post("/users", authenticateToken, onlySupervisors, async (req, res) => {
  try {
    const { userId, action, field, oldValue, newValue } = req.body;

    if (!userId || !action)
      return res.status(400).json({ message: "userId та action обовʼязкові" });

    await UserLog.create({
      userId,
      editorId: req.user.id,
      action, // 'create' | 'update' | 'delete'
      field,
      oldValue:
        typeof oldValue === "object" ? JSON.stringify(oldValue) : oldValue,
      newValue:
        typeof newValue === "object" ? JSON.stringify(newValue) : newValue,
    });

    res.sendStatus(201);
  } catch (err) {
    console.error("POST /logs/users error:", err);
    res.status(500).json({ message: err.message });
  }
});

/* ============================================================
 * GET /api/logs/users   —  отримати всі логи користувачів
 * ========================================================== */
router.get("/users", authenticateToken, onlySupervisors, async (_req, res) => {
  try {
    const logs = await UserLog.findAll({
      include: [
        {
          model: User,
          as: "editor",
          attributes: ["id", "name", "email"],
          paranoid: false,
        },
        {
          model: User,
          as: "target",
          attributes: ["id", "name", "email"],
          paranoid: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(logs);
  } catch (err) {
    console.error("GET /logs/users error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
