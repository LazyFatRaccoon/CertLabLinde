// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const { v4: uuidv4 } = require("uuid");
// const PdfConverter = require("pdf-poppler");

// const upload = multer({ dest: "uploads/" });

// router.post("/upload-template", upload.single("file"), async (req, res) => {
//   const pdfPath = req.file.path;
//   const outputDir = path.join(__dirname, "..", "public");
//   const outputPrefix = uuidv4();

//   try {
//     await PdfConverter.convert(pdfPath, {
//       format: "png",
//       out_dir: outputDir,
//       out_prefix: outputPrefix,
//       page: 1,
//       resolution: 450,
//     });

//     fs.unlinkSync(pdfPath);

//     const outputFilename = `${outputPrefix}-1.png`; // pdf-poppler додає "-1" до імені
//     res.json({ imageUrl: `/${outputFilename}` });
//   } catch (err) {
//     console.error("PDF → PNG error:", err);
//     res.status(500).json({ message: "Не вдалося обробити PDF" });
//   }
// });
// module.exports = router;

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { v4: uuid } = require("uuid");
const { PDFDocument } = require("pdf-lib");

const { Template, TemplateLog } = require("../models");
const authenticateToken = require("../middleware/authenticate");
const onlySupervisors = require("../middleware/onlySupervisors");
const { normalizeField } = require("../utils/normalizeField");

const upload = multer({ storage: multer.memoryStorage() });

/* ---------- helper: save bg & return meta ---------- */
async function saveBg(id, file) {
  const dir = path.join(__dirname, "..", "public", "templates");
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
    const original = await PDFDocument.load(file.buffer);
    const newPdf = await PDFDocument.create();
    const [first] = await newPdf.copyPages(original, [0]);
    newPdf.addPage(first);

    const pdfBytes = await newPdf.save();
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
    attributes: ["id", "name"],
    order: [["createdAt", "DESC"]],
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

      // ── фон
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
        diff: null,
      });

      res.status(201).json(tpl);
    } catch (e) {
      console.error("POST /templates →", e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* === PUT update ======================================================== */
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

      // назва
      if (req.body.name !== undefined) tpl.name = req.body.name.trim();

      // поля
      if (req.body.fields !== undefined) {
        tpl.fields = JSON.parse(req.body.fields).map(normalizeField);
      }

      // фон
      if (req.file) Object.assign(tpl, await saveBg(tpl.id, req.file));

      tpl.updatedBy = req.user.id;
      await tpl.save();

      await TemplateLog.create({
        templateId: tpl.id,
        editorId: req.user.id,
        action: "update",
        diff: { before, after: tpl.toJSON() },
      });

      res.json(tpl);
    } catch (e) {
      console.error("PUT /templates →", e);
      res.status(500).json({ message: "Server error" });
    }
  }
);

/* === DELETE (soft) ===================================================== */
router.delete("/:id", authenticateToken, onlySupervisors, async (req, res) => {
  const tpl = await Template.findByPk(req.params.id);
  if (!tpl) return res.status(404).json({ message: "Не знайдено" });

  await tpl.destroy(); // paranoid → sets deletedAt
  await TemplateLog.create({
    templateId: tpl.id,
    editorId: req.user.id,
    action: "delete",
    diff: null,
  });
  res.sendStatus(204);
});

module.exports = router;
