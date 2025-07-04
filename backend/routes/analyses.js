// routes/analyses.js
const express = require("express");
const router = express.Router();
const { Analysis, AnalysisLog, Template, User } = require("../models");
const authenticate = require("../middleware/authenticate");

const canEdit = (roles = []) =>
  roles.includes("manager") || roles.includes("supervisor");
const canCreate = (roles = []) => roles.includes("lab") || canEdit(roles);

/* ─────────────────────────
   GET /api/analyses?tpl=<id>
   ───────────────────────── */
router.get("/", authenticate, async (req, res) => {
  try {
    const where = req.query.tpl ? { templateId: req.query.tpl } : {};
    const list = await Analysis.findAll({
      where,
      include: [
        { model: Template, as: "template", attributes: ["id", "name"] },
        { model: User, as: "author", attributes: ["id", "name", "email"] },
      ],
      order: [["createdAt", "DESC"]],
    });
    res.json(list);
  } catch (e) {
    console.error("GET /analyses error", e);
    res.status(500).json({ message: "Server error" });
  }
});

/* ─────────────── POST create ─────────────── */
router.post("/", authenticate, async (req, res) => {
  if (!canCreate(req.user.roles)) return res.sendStatus(403);

  const { templateId, data } = req.body; // 👈 правильна назва
  try {
    const analysis = await Analysis.create({
      templateId,
      data,
      createdBy: req.user.id,
    });

    await AnalysisLog.create({
      analysisId: analysis.id,
      editorId: req.user.id,
      action: "create",
      diff: { before: null, after: data },
    });

    res.status(201).json(analysis);
  } catch (e) {
    console.error("POST /analyses error", e);
    res.status(500).json({ message: "Server error" });
  }
});
/* ─────────────── PUT update ─────────────── */
router.put("/:id", authenticate, async (req, res) => {
  if (!canEdit(req.user.roles)) return res.sendStatus(403);

  const rec = await Analysis.create({
    templateId,
    data,
    createdBy: req.user.id,
  });

  await AnalysisLog.create({
    analysisId: rec.id,
    editorId: req.user.id,
    action: "create",
    diff: { before: null, after: data },
  });

  res.status(201).json(rec);
});

/* ─────────────── DELETE (soft) ─────────────── */
router.delete("/:id", authenticate, async (req, res) => {
  if (!canEdit(req.user.roles)) return res.sendStatus(403);

  const rec = await Analysis.findByPk(req.params.id);
  if (!rec) return res.sendStatus(404);

  await rec.destroy(); // paranoid → запише deletedAt
  await AnalysisLog.create({
    analysisId: rec.id,
    editorId: req.user.id,
    action: "delete",
    diff: { before: rec.data, after: null },
  });

  res.sendStatus(204);
});

module.exports = router;
