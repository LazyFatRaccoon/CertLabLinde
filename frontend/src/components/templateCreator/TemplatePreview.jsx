// TemplatePreview.jsx
import React from "react";

export default function TemplatePreview({ src, width, height, fields }) {
  return (
    <div
      style={{ width, height, position: "relative" }}
      className="border rounded shadow"
    >
      <img
        src={src}
        alt="bg"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />

      {/* overlay-тексти */}
      {fields
        .filter((f) => f.render !== false && f.demo)
        .map((f) => {
          // x,y – нижній-ліві нормалізовані (0-1)
          const left = `${(f.x || 0) * 100}%`;
          const top = `${(f.y || 0) * 100}%`;

          const style = {
            position: "absolute",
            left,
            top,
            transform: "translateY(-100%)", // щоб (x,y) був нижнім лівим
            fontFamily: f.font || "Arial",
            fontSize: (f.fontSize || 12) + "px",
            color: f.color || "#000",
            fontWeight: f.bold ? "700" : "400",
            fontStyle: f.italic ? "italic" : "normal",
            textDecoration: f.underline ? "underline" : "none",
            whiteSpace: "pre",
          };

          return (
            <span key={f.id} style={style}>
              {f.demo}
            </span>
          );
        })}
    </div>
  );
}
