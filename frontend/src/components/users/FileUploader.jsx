import React, { useEffect, useState, useRef } from "react";
import { Button } from "../ui/button";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.entry";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function FileUploader({
  accept = ["image/png"],
  previewWidth = 48,
  previewHeight = 48,
  initialUrl = "",
  onChange,
  removable = true,
  verticalFlex = false,
  onPick,
  overlayFields = [],
}) {
  const [preview, setPreview] = useState(initialUrl);
  const inputRef = useRef(null);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!initialUrl || !initialUrl.endsWith(".pdf")) {
      setPreview(initialUrl);
      return;
    } // коли initialUrl змінюється – оновлюємо/скидаємо превʼю

    fetch(initialUrl)
      .then((r) => r.arrayBuffer())
      .then(async (buf) => {
        const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport })
          .promise;
        setPreview(canvas.toDataURL("image/png"));
      });
  }, [initialUrl]);

  const clickHandler = (e) => {
    if (!onPick || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return; // zero-size
    const xRaw = (e.clientX - rect.left) / rect.width;
    const yRaw = 1 - (e.clientY - rect.top) / rect.height;
    if (!Number.isFinite(xRaw) || !Number.isFinite(yRaw)) return;
    onPick(+xRaw.toFixed(4), +yRaw.toFixed(4));
  };

  const handleFile = async (file) => {
    if (!file) return;

    if (file.type === "application/pdf") {
      const arrayBuf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
      const page = await pdf.getPage(1);

      // готуємо канвас  — 100 × 100 px або масштабуй як треба
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: canvas.getContext("2d"), viewport })
        .promise;
      setPreview(canvas.toDataURL("image/png")); // 👉 превʼю першої сторінки
      onChange?.(file);
      return;
    }
    if (accept.length && !accept.includes(file.type)) {
      alert("Неприпустимий тип файлу");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      onChange?.(file);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={
        verticalFlex
          ? "flex flex-col items-center gap-2 select-none"
          : "flex items-center gap-2"
      }
    >
      <div
        style={{
          width: previewWidth,
          height: previewHeight,
          position: "relative",
        }}
        className="border rounded"
      >
        {preview && (
          <img
            ref={imgRef}
            src={preview}
            alt="preview"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
            onClick={clickHandler}
          />
        )}

        {/* overlay demo texts */}
        {overlayFields
          .filter(
            (f) =>
              preview &&
              f.render !== false &&
              Number.isFinite(f.x) &&
              Number.isFinite(f.y) &&
              (f.x !== 0 || f.y !== 0)
          )
          .map((f) => {
            const left = `${(f.x || 0) * 100}%`;
            const top = `${(1 - f.y || 0) * 100}%`;

            /* ─────────── картинки (Підпис / Печатка) ─────────── */
            if (f.type === "img" && f.imageUrl) {
              return (
                <img
                  key={f.id}
                  src={f.imageUrl}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    transform: "translateY(-100%)",
                    width: f.size,
                    height: "auto",
                    pointerEvents: "none",
                  }}
                  alt={f.label}
                />
              );
            }

            /* ─────────── звичайний текст ─────────── */
            if (f.demo) {
              return (
                <span
                  key={f.id}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    transform: "translateY(-100%)",
                    fontFamily: f.font || "Arial",
                    fontSize: (f.fontSize || 16) + "px",
                    color: f.color || "#000",
                    fontWeight: f.bold ? 700 : 400,
                    fontStyle: f.italic ? "italic" : "normal",
                    textDecoration: f.underline ? "underline" : "none",
                    whiteSpace: "pre",
                    pointerEvents: "none",
                  }}
                >
                  {f.demo}
                </span>
              );
            }
            return null; // нічого не малюємо
          })}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        hidden
        onChange={(e) => handleFile(e.target.files?.[0])}
        autoComplete="off"
      />
      <Button
        type="button"
        variant="secondary"
        onClick={() => inputRef.current?.click()}
      >
        {preview ? "Змінити" : "Завантажити"}
      </Button>
      {preview && removable && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setPreview("");
            onChange?.(null);
          }}
        >
          Видалити
        </Button>
      )}
    </div>
  );
}
