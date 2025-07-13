// routes/public.js  — складення PDF‑сертифіката без авторизації
// ------------------------------------------------------------------
const express = require("express");
const router = express.Router();

const path = require("path");
const fs = require("fs/promises");
const pdfLib = require("pdf-lib");

const { Analysis, Template, User } = require("../models");
const { fonts } = require("../constants/fonts");
const { loadAllFonts } = require("../utils/fontLoader");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..");

function toDDMMYYYY(raw) {
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(raw)) return raw; // вже у DD.MM.YYYY
  const d = new Date(raw);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

//--------------------------------------------------------------------
// POST  /api/public/certificates
// body = { product, date:"DD.MM.YYYY", batch }
//--------------------------------------------------------------------
router.post("/certificates", async (req, res) => {
  const { product, date, batch } = req.body || {};
  console.log("▶️  Request body:", req.body);

  if (!product || !date || !batch) {
    return res.status(400).json({ message: "Неповні дані" });
  }

  try {
    //----------------------------------------------------------------
    // 1️⃣  шукаємо ОСТАННІЙ аналіз, який має потрібні значення
    //----------------------------------------------------------------
    const analyses = await Analysis.findAll({
      include: [
        { model: Template, as: "template" },
        { model: User, as: "author" },
      ],
      order: [["createdAt", "DESC"]],
    });

    let analysis = null;

    for (const a of analyses) {
      if (!a.template) continue; // пропускаємо "сирі" записи

      // створюємо мапу  label → id   для КОЖНОГО шаблону
      const FIELD_ID = {};
      a.template.fields.forEach((f) => (FIELD_ID[f.label] = f.id));

      const d = a.data || {};
      console.log(d[FIELD_ID["Продукт"]]);
      console.log(product);
      console.log(d[FIELD_ID["Партія"]]);
      console.log(batch);
      console.log(d[FIELD_ID["Дата проведення аналізу"]]);
      console.log(date);
      if (
        d[FIELD_ID["Продукт"]] === product &&
        d[FIELD_ID["Партія"]] === String(batch) &&
        toDDMMYYYY(d[FIELD_ID["Дата проведення аналізу"]]) === toDDMMYYYY(date)
      ) {
        analysis = a;
        break; // цього досить ⇒ виходимо
      }
    }

    if (!analysis) {
      console.log("ℹ️  Не знайдено відповідного аналізу");
      return res.status(404).json({ message: "Такий аналіз не знайдено" });
    }

    console.log("✅ Знайдено analysis.id =", analysis.id);

    //----------------------------------------------------------------
    // 2️⃣  відкриваємо PDF-бекграунд
    //----------------------------------------------------------------
    const tpl = analysis.template;
    //const bgRel = tpl.bgFile.replace("/public/", "public/");
    const bgAbs = path.join(
      DATA_DIR,
      tpl.bgFile.replace("/public/", "public/")
    );

    const pdfDoc = await pdfLib.PDFDocument.load(await fs.readFile(bgAbs));
    const fontMap = await loadAllFonts(pdfDoc, fonts); // { regular,bold,italic,boldItalic,black }

    const page = pdfDoc.getPage(0);
    const { width: hW, height: hH } = page.getSize();
    const pctX = (x) => x * hW;
    const pctY = (y) => y * hH;
    //const pctY = (y) => hH - y * hH; // (0,0) → upper‑left

    //----------------------------------------------------------------
    // helper вибору шрифту
    //----------------------------------------------------------------

    //----------------------------------------------------------------
    // 3️⃣  Текстові поля
    //----------------------------------------------------------------
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
        y: pctY(f.y) + (f.fontSize ?? 16) * 0.2, // трохи підняти, аби текст
        size: fontSize,
        font,
        color: pdfLib.rgb(r, g, b),
      });

      // підкреслення
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

    //----------------------------------------------------------------
    // 4️⃣  Зображення: печатка та підпис
    //----------------------------------------------------------------
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

    const stampField = tpl.fields.find(
      (f) => f.label === "Печатка" && f.render !== false
    );
    const signField = tpl.fields.find(
      (f) => f.label === "Підпис" && f.render !== false
    );
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

    //----------------------------------------------------------------
    // 5️⃣  Віддаємо PDF
    //----------------------------------------------------------------
    const pdfBytes = await pdfDoc.save();
    console.log(
      "📄  Генерований PDF:",
      pdfBytes.length.toLocaleString(),
      "bytes"
    );

    return res
      .set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${batch}.pdf"`,
      })
      .send(pdfBytes);
  } catch (err) {
    console.error("❌  certificate error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
