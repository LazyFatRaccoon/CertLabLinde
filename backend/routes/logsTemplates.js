const express = require("express");
const router = express.Router();
const { TemplateLog, Template, User } = require("../models");
const authenticateToken = require("../middleware/authenticate");

/**
 * GET /api/logs/templates
 * Повертає повний журнал змін шаблонів.
 * Доступ → supervisor | constructor
 */
router.get("/templates", authenticateToken, async (req, res) => {
  const roles = req.user.roles || [];

  if (!roles.includes("supervisor") && !roles.includes("constructor")) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const list = await TemplateLog.findAll({
      include: [
        { model: Template, as: "template", attributes: ["id", "name"] },
        { model: User, as: "editor", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json(list);
  } catch (e) {
    console.error("GET /logs/templates", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
