const fs = require("fs");
const path = require("path");
//const pdfLib = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");

const FONT_DIR = path.join(__dirname, "..", "public", "fonts", "Arial");

const fontFiles = {
  regular: "ArialRegular.ttf",
  bold: "ArialBold.ttf",
  italic: "ArialItalic.ttf",
  boldItalic: "ArialBoldItalic.ttf",
  black: "ArialBlack.ttf", // опційно
};

async function loadFonts(pdfDoc) {
  pdfDoc.registerFontkit(fontkit);
  const fonts = {};
  for (const [key, file] of Object.entries(fontFiles)) {
    const buf = fs.readFileSync(path.join(FONT_DIR, file));
    fonts[key] = await pdfDoc.embedFont(buf, { subset: true });
  }
  //console.log("Fonts: ", fonts);
  return fonts; // { regular, bold, italic, boldItalic, black }
}

module.exports = { loadFonts };
