const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuid } = require("uuid");

const { Template, TemplateLog, Setting } = require("../models");
const authenticateToken = require("../middleware/authenticate");
const onlySupervisors = require("../middleware/onlySupervisors");
const { normalizeField } = require("../utils/normalizeField");
const normalizeA4 = require("../utils/normalizeA4");

const upload = multer({ storage: multer.memoryStorage() });

async function getSettingMap(key) {
  const setting = await Setting.findOne({ where: { key } });
  const entries = setting?.value || [];
  return Object.fromEntries(entries.map((x) => [x.id, x.name]));
}

async function extractMeta(fields) {
  const loc = fields.find((f) => f.label === "Локація" && f.options?.length);
  const prod = fields.find((f) => f.label === "Продукт" && f.options?.length);

  const locationMap = await getSettingMap("locations");
  const productMap = await getSettingMap("products");

  const locationId = Number(loc?.options?.[0]);
  const productId = Number(prod?.options?.[0]);

  return {
    location: locationMap[locationId] || null,
    product: productMap[productId] || null,
  };
}

/* ---------- helper: save bg & return meta ---------- */
async function saveBg(id, file) {
  const dir = path.join(
    process.env.DATA_DIR || path.join(__dirname, ".."),
    "public",
    "templates"
  );
  fs.mkdirSync(dir, { recursive: true });

  // PNG / JPEG -----------------------------------------------------------
  if (file.mimetype.startsWith("image/")) {
    const ext = file.mimetype === "image/png" ? ".png" : ".jpg";
    const fileName = `${id}${ext}`;
    fs.writeFileSync(path.join(dir, fileName), file.buffer);

    const { width, height } = await sharp(file.buffer).metadata();
    return { bgFile: `/public/templates/${fileName}`, width, height };
  }

  // PDF → залишаємо лише першу сторінку -------------------------------
  if (file.mimetype === "application/pdf") {
    const pdfBytes = await normalizeA4(file.buffer);

    const fileName = `${id}.pdf`;
    fs.writeFileSync(path.join(dir, fileName), pdfBytes);

    /* PDF сам по собі не дає width/height; можна задати дефолт,
       фронту вони не критичні, бо він і так робить превʼю. */
    return { bgFile: `/public/templates/${fileName}` };
  }

  // інший тип — не підтримуємо
  throw new Error("Непідтримуваний тип файлу");
}

/* === GET list / single ================================================= */
router.get("/", authenticateToken, async (_req, res) => {
  const list = await Template.findAll({
    attributes: [
      "id",
      "name",
      "fields", // ← додано
      "bgFile", // (не обов’язково – але корисно)
      "width",
      "height",
    ],
    order: [["createdAt", "DESC"]],
    paranoid: true,
    //paranoid: false, // щоб не показувати видалені – прибери, якщо зайве
  });
  res.json(list);
});

router.get("/public", async (_req, res) => {
  const list = await Template.findAll({
    attributes: [
      "id",
      "name",
      "fields", // ← додано
      "bgFile", // (не обов’язково – але корисно)
      "width",
      "height",
    ],
    order: [["createdAt", "DESC"]],
    //paranoid: false, // щоб не показувати видалені – прибери, якщо зайве
  });
  res.json(list);
});

router.get("/:id", authenticateToken, async (req, res) => {
  const tpl = await Template.findByPk(req.params.id);
  if (!tpl) return res.status(404).json({ message: "Не знайдено" });
  res.json(tpl);
});

/* === POST create ======================================================= */
router.post(
  "/",
  authenticateToken,
  onlySupervisors,
  upload.single("bg"),
  async (req, res) => {
    try {
      if (!req.body.name?.trim())
        return res.status(400).json({ message: "name обов'язкове" });

      const id = uuid();
      const rawFields = JSON.parse(req.body.fields || "[]");
      const normFields = rawFields.map(normalizeField);
      const meta = await extractMeta(normFields);
      const extra = req.file ? await saveBg(id, req.file) : {};

      const tpl = await Template.create({
        id,
        name: req.body.name.trim(),
        fields: normFields,
        createdBy: req.user.id,
        ...extra,
      });

      await TemplateLog.create({
        templateId: tpl.id,
        editorId: req.user.id,
        action: "create",
        diff: {
          name: tpl.name,
          bgFile: tpl.bgFile,
          location: meta.location,
          product: meta.product,
          fields: normFields.map((f) => f.label),
        },
      });

      res.status(201).json(tpl);
    } catch (e) {
      console.error("POST /templates →", e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put(
  "/:id",
  authenticateToken,
  onlySupervisors,
  upload.single("bg"),
  async (req, res) => {
    try {
      const tpl = await Template.findByPk(req.params.id);
      if (!tpl) return res.status(404).json({ message: "Не знайдено" });

      const before = tpl.toJSON();
      //console.log("before", before);
      const beforeMeta = await extractMeta(before.fields);

      if (req.body.name !== undefined) tpl.name = req.body.name.trim();
      if (req.body.fields !== undefined) {
        tpl.fields = JSON.parse(req.body.fields).map(normalizeField);
      }
      if (req.file) Object.assign(tpl, await saveBg(tpl.id, req.file));

      tpl.updatedBy = req.user.id;
      await tpl.save();

      const after = tpl.toJSON();
      //console.log("after", after);
      const afterMeta = await extractMeta(after.fields);

      const changedFields = [];
      const beforeFields = before.fields.filter(
        (f) => f.label !== "Локація" && f.label !== "Продукт"
      );
      const afterFields = after.fields.filter(
        (f) => f.label !== "Локація" && f.label !== "Продукт"
      );
      const labelSet = new Set([
        ...beforeFields.map((f) => f.label),
        ...afterFields.map((f) => f.label),
      ]);

      for (const label of labelSet) {
        const b = beforeFields.find((f) => f.label === label);
        const a = afterFields.find((f) => f.label === label);
        if (JSON.stringify(b) !== JSON.stringify(a)) {
          changedFields.push(label);
        }
      }
      //console.log("Змінені поля:", changedFields);
      await TemplateLog.create({
        templateId: tpl.id,
        editorId: req.user.id,
        action: "update",
        diff: {
          before: {
            name: before.name,
            bgFile: before.bgFile,
            location: beforeMeta.location,
            product: beforeMeta.product,
            fields: changedFields,
          },
          after: {
            name: after.name,
            bgFile: after.bgFile,
            location: afterMeta.location,
            product: afterMeta.product,
            fields: changedFields,
          },
        },
      });

      res.json(tpl);
    } catch (e) {
      console.error("PUT /templates →", e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.delete("/:id", authenticateToken, onlySupervisors, async (req, res) => {
  try {
    const tpl = await Template.findByPk(req.params.id);
    if (!tpl) return res.status(404).json({ message: "Не знайдено" });

    const meta = await extractMeta(tpl.fields);

    await TemplateLog.create({
      templateId: tpl.id,
      editorId: req.user.id,
      action: "delete",
      diff: {
        name: tpl.name,
        location: meta.location,
        product: meta.product,
        fields: tpl.fields.map((f) => f.label),
        bgFile: tpl.bgFile,
      },
    });

    if (tpl.bgFile) {
      const bgPath = path.join(
        process.env.DATA_DIR || path.join(__dirname, ".."),
        tpl.bgFile.replace(/^\/?public\//, "public/")
      );

      fs.promises.unlink(bgPath).catch((err) => {
        console.warn(
          "⚠️ Не вдалося видалити файл шаблону:",
          bgPath,
          err.message
        );
      });
    }

    await tpl.destroy();
    res.sendStatus(204);
  } catch (e) {
    console.error("DELETE /templates →", e);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
