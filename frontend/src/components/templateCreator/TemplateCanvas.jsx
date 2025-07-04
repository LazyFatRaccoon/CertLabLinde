import React from "react";

export default function TemplateCanvas({ bgUrl, fields, onPickCoord }) {
  const canvasRef = React.useRef();

  const clickHandler = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    /* шукаємо «активне» поле – наприклад, останнє обране в таблиці
       (сюди можна додати окремий state activeFieldId) */
    const active = fields.find((f) => f.active);
    if (active) onPickCoord(active.id, x, y);
  };

  return (
    <div className="relative border inline-block">
      {bgUrl ? (
        <img
          ref={canvasRef}
          src={bgUrl}
          alt="bg"
          onClick={clickHandler}
          className="select-none"
        />
      ) : (
        <div className="w-full h-32 flex items-center justify-center text-gray-500">
          Завантажте фон
        </div>
      )}

      {/* маркери полів */}
      {bgUrl &&
        fields.map(
          (f) =>
            f.render !== false && (
              <div
                key={f.id}
                className="absolute rounded-full bg-blue-500/60"
                style={{
                  left: f.x,
                  top: f.y,
                  width: 6,
                  height: 6,
                  transform: "translate(-50%, -50%)",
                }}
                title={`${f.label} (${f.x},${f.y})`}
              />
            )
        )}
    </div>
  );
}
