const { PDFDocument, degrees } = require("pdf-lib");

const A4_PORTRAIT = { w: 595.28, h: 841.89 }; // pt (210×297 мм)

module.exports = async function normalizeA4(pdfBytes) {
  // 1️⃣ завантажуємо оригінал
  const src = await PDFDocument.load(pdfBytes);

  // 2️⃣ створюємо новий чистий PDF
  const dst = await PDFDocument.create();
  dst.setCreator("CertLab Linde");
  dst.setProducer("CertLab Linde PDF generator");
  dst.setTitle("Certificate template (A4 portrait)");
  dst.setCreationDate(new Date());

  // 3️⃣ копіюємо першу сторінку
  const [srcPage] = await dst.copyPages(src, [0]);
  let { width: w, height: h } = srcPage.getSize();

  // 4️⃣ якщо ландшафт – повертаємо
  if (w > h) {
    srcPage.setRotation(degrees(90));
    [w, h] = [h, w];
  }

  // 5️⃣ масштабуємо у «рамки» A4 (пропорційно)

  const scale = Math.min(A4_PORTRAIT.w / w, A4_PORTRAIT.h / h);
  const offsetX = (A4_PORTRAIT.w - w * scale) / 2;
  const offsetY = (A4_PORTRAIT.h - h * scale) / 2;
  const embed = await dst.embedPage(srcPage);
  const page = dst.addPage([A4_PORTRAIT.w, A4_PORTRAIT.h]);
  page.drawPage(embed, {
    x: offsetX,
    y: offsetY,
    xScale: scale,
    yScale: scale,
  });

  return await dst.save(); // Uint8Array
};
