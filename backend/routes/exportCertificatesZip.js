// routes/exportCertificatesZip.js
const express = require("express");
const router = express.Router();

const path = require("path");
const fs = require("fs/promises");
const fsSync = require("fs");
const os = require("os");
const crypto = require("crypto");
const archiver = require("archiver");
const pdfLib = require("pdf-lib");

const { Analysis, Template, User } = require("../models");
const { fonts } = require("../constants/fonts");
const { loadAllFonts } = require("../utils/fontLoader");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..");

function toDDMMYYYY(raw) {
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) return raw;
  const d = new Date(raw);
  return `${String(d.getDate()).padStart(2, "0")}.${String(
    d.getMonth() + 1
  ).padStart(2, "0")}.${d.getFullYear()}`;
}

router.post("/certificates/zip", async (req, res) => {
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0)
    return res.status(400).json({ message: "Немає ідентифікаторів" });

  try {
    const analyses = await Analysis.findAll({
      where: { id: ids },
      include: [
        { model: Template, as: "template" },
        { model: User, as: "author" },
      ],
    });

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "certs-"));
    const files = [];

    for (const analysis of analyses) {
      const tpl = analysis.template;
      const FIELD_ID = {};
      tpl.fields.forEach((f) => (FIELD_ID[f.label] = f.id));
      const batch = analysis.data?.[FIELD_ID["Партія"]] ?? "";
      const date = toDDMMYYYY(
        analysis.data?.[FIELD_ID["Дата проведення аналізу"]] ?? ""
      );

      if (!tpl.bgFile) continue;
      const bgAbs = path.join(
        DATA_DIR,
        tpl.bgFile.replace("/public/", "public/")
      );
      const pdfDoc = await pdfLib.PDFDocument.load(await fs.readFile(bgAbs));
      const fontMap = await loadAllFonts(pdfDoc, fonts);
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();
      const pctX = (x) => x * width;
      const pctY = (y) => y * height;

      for (const f of tpl.fields) {
        if (f.type === "img" || f.render === false) continue;
        const val = analysis.data?.[f.id];
        if (!val) continue;

        const hex = (f.color ?? "#000000").replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16) / 255;
        const g = parseInt(hex.slice(2, 4), 16) / 255;
        const b = parseInt(hex.slice(4, 6), 16) / 255;

        const fam = f.font || "Arial";
        const weight =
          f.bold && f.italic
            ? "boldItalic"
            : f.bold
            ? "bold"
            : f.italic
            ? "italic"
            : "regular";
        const font = fontMap.get(fam)[weight] || fontMap.get(fam).regular;
        const fontSize = f.fontSize ?? 16;

        page.drawText(String(val), {
          x: pctX(f.x),
          y: pctY(f.y) + fontSize * 0.2,
          size: fontSize,
          font,
          color: pdfLib.rgb(r, g, b),
        });

        if (f.underline) {
          const txtW = font.widthOfTextAtSize(String(val), fontSize);
          page.drawLine({
            start: { x: pctX(f.x), y: pctY(f.y) - 1.7 },
            end: { x: pctX(f.x) + txtW, y: pctY(f.y) - 1.7 },
            thickness: 0.5,
            color: pdfLib.rgb(r, g, b),
          });
        }
      }

      const stampField = tpl.fields.find(
        (f) => f.label === "Печатка" && f.render !== false
      );
      const signField = tpl.fields.find(
        (f) => f.label === "Підпис" && f.render !== false
      );

      const addPng = async (filePath, sizePx, xPerc, yPerc) => {
        const img = await pdfDoc.embedPng(await fs.readFile(filePath));
        const h = sizePx * (img.height / img.width);
        page.drawImage(img, {
          x: pctX(xPerc),
          y: pctY(yPerc),
          width: sizePx,
          height: h,
        });
      };

      if (signField && analysis.author?.signature) {
        const signP = path.join(DATA_DIR, "public", analysis.author.signature);
        try {
          await fs.access(signP);
          await addPng(signP, signField.size, signField.x, signField.y);
        } catch {}
      }

      if (stampField) {
        const stampP = path.join(DATA_DIR, "public", "stamp.png");
        try {
          await fs.access(stampP);
          await addPng(stampP, stampField.size, stampField.x, stampField.y);
        } catch {}
      }

      const fileName = `${tpl.name}_${batch}_${date.replaceAll(".", "")}.pdf`;
      const filePath = path.join(tmpDir, fileName);
      await fs.writeFile(filePath, await pdfDoc.save());
      files.push({ name: fileName, path: filePath });
    }

    const zipName = `certificates-${crypto.randomUUID()}.zip`;
    const zipPath = path.join(tmpDir, zipName);
    const output = fsSync.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    archive.pipe(output);
    for (const file of files) archive.file(file.path, { name: file.name });
    await archive.finalize();

    output.on("close", async () => {
      res.download(zipPath, zipName, async () => {
        try {
          await fs.rm(tmpDir, { recursive: true, force: true });
        } catch {}
      });
    });
  } catch (err) {
    console.error("❌ /certificates/zip error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
