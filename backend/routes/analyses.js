// routes/analyses.js
const express = require("express");
const router = express.Router();
const {
  Analysis,
  AnalysisLog,
  Template,
  User,
  Setting,
  Counter,
} = require("../models");
const authenticate = require("../middleware/authenticate");
const { buildDateFilter } = require("../utils/period");
const ExcelJS = require("exceljs"); // 👈 додаємо для експорту
const { Op } = require("sequelize");

const canEdit = (roles = []) =>
  roles.includes("manager") || roles.includes("supervisor");
const canCreate = (roles = []) => roles.includes("lab") || canEdit(roles);

const getLoc = (tpl) => {
  const f = tpl.fields?.find(
    (x) => x.label === "Локація" && x.type === "selectOnce"
  );
  return f?.options?.[0] || "Інше";
};

const getCat = (tpl) => {
  const f = tpl.fields?.find(
    (x) => x.label === "Продукт" && x.type === "selectOnce"
  );
  return f?.options?.[0] || "Інше";
};

async function getNextAnalysisNumber() {
  const [counter] = await Counter.findOrCreate({
    where: { key: "analysisNumber" },
    defaults: { value: 1 },
  });

  counter.value += 1;
  await counter.save();

  return counter.value;
}

router.post("/new", async (req, res) => {
  try {
    const number = await getNextAnalysisNumber();
    return res.json({ number });
  } catch (err) {
    console.error("❌ Помилка при отриманні номеру", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* ─────────────────────────
   GET /api/analyses?tpl=<id>
   ───────────────────────── */
router.get("/", authenticate, async (req, res) => {
  try {
    const { period = "week", from, to, tpl } = req.query;

    const where = { ...buildDateFilter({ period, from, to }) };

    if (tpl) where.templateId = tpl;

    const includeBase = [
      { model: Template, as: "template", attributes: ["id", "name"] },
      { model: User, as: "author", attributes: ["id", "name", "email"] },
    ];

    const include = req.user.roles.includes("supervisor")
      ? [
          ...includeBase,
          {
            model: AnalysisLog,
            as: "logs",
            include: [
              {
                model: User,
                as: "editor",
                attributes: ["id", "name", "email"],
              },
            ],
            order: [["createdAt", "ASC"]],
          },
        ]
      : includeBase;

    const list = await Analysis.findAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
      paranoid: !req.user.roles.includes("supervisor"),
    });

    res.json(list);
  } catch (err) {
    console.error("GET /analyses error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
function sanitizeSheetName(name) {
  return name.replace(/[*?:\\/[\]]/g, "_").slice(0, 31);
}
/* ────────────────────────────────
   GET /api/analyses/export-all
   ──────────────────────────────── */
router.get("/export-all", authenticate, async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;

    // 🔧 Внутрішня функція для мапінгу
    async function getSettingMap(key) {
      const setting = await Setting.findOne({ where: { key } });
      const entries = setting?.value || [];
      return Object.fromEntries(entries.map((x) => [x.id, x.name]));
    }

    // 🗺️ Отримуємо карти імен
    const [templates, locationMap, productMap] = await Promise.all([
      Template.findAll(),
      getSettingMap("locations"),
      getSettingMap("products"),
    ]);

    const workbook = new ExcelJS.Workbook();
    const allSheet = workbook.addWorksheet("Всі аналізи");

    const sortedTemplates = [...templates].sort((a, b) => {
      const locA = locationMap[getLoc(a)] || "";
      const locB = locationMap[getLoc(b)] || "";
      return locA.localeCompare(locB);
    });

    const usedNames = new Set();
    const locationSheets = {};

    // Паралельна обробка кожного шаблону
    const analysisPromises = sortedTemplates.map(async (tpl) => {
      const locationId = getLoc(tpl);
      const productId = getCat(tpl);
      const location = locationMap[locationId] || String(locationId);
      const product = productMap[productId] || String(productId);
      const tplName = tpl.name;
      const rawSheetName = `${location}_${product}_${tplName}`;
      const sheetName = sanitizeSheetName(rawSheetName);

      const fields = tpl.fields.filter((f) => f.type !== "img");
      const headers = fields.map((f) => f.label);

      const where = { templateId: tpl.id };
      if (fromDate && toDate) {
        where.createdAt = { [Op.between]: [fromDate, toDate] };
      }

      const rows = await Analysis.findAll({
        where,
        order: [["createdAt", "ASC"]],
      });

      // Всі аналізи
      allSheet.addRow([]);
      allSheet.addRow([rawSheetName]);
      allSheet.addRow(headers);
      for (const row of rows) {
        const rowData = fields.map((f) => row.data?.[f.id] ?? "");
        allSheet.addRow(rowData);
      }

      // Індивідуальний аркуш
      let safeSheetName = sheetName;
      let suffix = 1;
      while (usedNames.has(safeSheetName)) {
        safeSheetName = sanitizeSheetName(
          `${sheetName.slice(0, 28)}_${suffix++}`
        );
      }
      usedNames.add(safeSheetName);

      const tplSheet = workbook.addWorksheet(safeSheetName);
      tplSheet.addRow(headers);
      for (const row of rows) {
        const rowData = fields.map((f) => row.data?.[f.id] ?? "");
        tplSheet.addRow(rowData);
      }

      // Локаційний аркуш
      if (!locationSheets[location]) {
        locationSheets[location] = {
          sheet: workbook.addWorksheet(location),
          products: {},
        };
      }
      const locSheet = locationSheets[location].sheet;
      locSheet.addRow([]);
      locSheet.addRow([`${product}_${tplName}`]);
      locSheet.addRow(headers);
      for (const row of rows) {
        const rowData = fields.map((f) => row.data?.[f.id] ?? "");
        locSheet.addRow(rowData);
      }

      // Продукт в межах локації
      if (!locationSheets[location].products[product]) {
        const prodSheetName = sanitizeSheetName(`${location}_${product}`);
        locationSheets[location].products[product] =
          workbook.addWorksheet(prodSheetName);
      }
      const prodSheet = locationSheets[location].products[product];
      prodSheet.addRow([]);
      prodSheet.addRow([tplName]);
      prodSheet.addRow(headers);
      for (const row of rows) {
        const rowData = fields.map((f) => row.data?.[f.id] ?? "");
        prodSheet.addRow(rowData);
      }
    });

    await Promise.all(analysisPromises);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent("усі_аналізи.xlsx")}`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("GET /analyses/export-all error:", err);
    res.status(500).json({ message: "Помилка експорту" });
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

  const { data } = req.body;
  const rec = await Analysis.findByPk(req.params.id);
  if (!rec) return res.sendStatus(404);

  const before = rec.data;
  rec.data = data;
  await rec.save();

  await AnalysisLog.create({
    analysisId: rec.id,
    editorId: req.user.id,
    action: "update",
    diff: { before, after: data },
  });

  res.status(200).json(rec);
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
