// server/routes/users.js
const express = require("express");
const { User, UserLog } = require("../models");
const authenticateToken = require("../middleware/authenticate");
const onlySupervisors = require("../middleware/onlySupervisors");
const router = express.Router();

// GET all users
router.get("/", authenticateToken, onlySupervisors, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        "id",
        "name",
        "email",
        "roles",
        "signature",
        "locationId",
        "lastLogin",
        "loginCount",
        "createdAt",
      ],
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// UPDATE user
router.put("/:id", authenticateToken, onlySupervisors, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const allowed = ["name", "roles", "locationId", "signature"];
    const updates = {};
    const diffOld = {};
    const diffNew = {};

    allowed.forEach((k) => {
      if (req.body[k] !== undefined && req.body[k] !== user[k]) {
        updates[k] = req.body[k];
        diffOld[k] = user[k];
        diffNew[k] = req.body[k];
      }
    });

    if (Object.keys(updates).length === 0)
      return res.status(200).json({ message: "Nothing changed" });

    /* 1️⃣  сам апдейт */
    await user.update(updates);

    /* 2️⃣  єдиний запис у журнал */
    await UserLog.create({
      userId: user.id,
      editorId: req.user.id,
      action: "update",
      field: Object.keys(updates).join(","), // "name,location"
      oldValue: JSON.stringify(diffOld),
      newValue: JSON.stringify(diffNew),
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("PUT /users/:id error:", err);
    res.status(500).json({ message: err.message });
  }
});

// DELETE user
router.delete("/:id", authenticateToken, onlySupervisors, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.roles.includes("supervisor") && user.id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Cannot delete another supervisor" });
    }
    await user.update({ email: `${user.email}#deleted_${Date.now()}` });

    await user.destroy();

    await UserLog.create({
      userId: user.id,
      editorId: req.user.id,
      action: "delete",
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("DELETE /users/:id error:", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
