const fs = require("fs");
const path = require("path");
const fontkit = require("@pdf-lib/fontkit");

const FONT_ROOT = path.join(__dirname, "..", "public", "fonts");

const FACE = {
  regular: "Regular",
  bold: "Bold",
  italic: "Italic",
  boldItalic: "BoldItalic",
};

function fontPath(family, face) {
  return path.join(FONT_ROOT, family, `${family}${FACE[face]}.ttf`);
}

/**
 * Завантажує шрифт-родину (Arial, Roboto …) у pdf-lib док.
 *
 * @param {PDFDocument} pdfDoc – вже створений PDFDocument
 * @param {string} family – назва шрифту (папки)
 * @returns {Promise<object>} { regular, bold, italic, boldItalic }
 */
async function loadFontFamily(pdfDoc, family) {
  pdfDoc.registerFontkit(fontkit);

  const out = {};
  for (const face of Object.keys(FACE)) {
    const file = fontPath(family, face);
    // якщо відсутній конкретний face – ігноруємо
    if (fs.existsSync(file)) {
      const buf = fs.readFileSync(file);
      out[face] = await pdfDoc.embedFont(buf, { subset: true });
    }
  }
  return out; // { regular, bold … }
}

/**
 * Читає всі родини зі `constants.js` та віддає Map,
 * щоб у полі можна було швидко дістати потрібний face:
 *
 *   const font = fonts.get('Roboto').boldItalic
 */
async function loadAllFonts(pdfDoc, families) {
  const result = new Map();
  for (const fam of families) {
    result.set(fam, await loadFontFamily(pdfDoc, fam));
  }
  return result;
}

module.exports = { loadFontFamily, loadAllFonts };
