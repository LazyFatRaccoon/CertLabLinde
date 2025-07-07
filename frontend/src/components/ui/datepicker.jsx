// src/components/ui/DatePicker.jsx
import { forwardRef } from "react";
import { Calendar } from "lucide-react";

/* helpers ────────────────────────────────────────────── */
const uiToIso = (ui = "") => {
  const [d, m, y] = ui.split(".");
  if (!d || !m || !y) return "";
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`; // 30.06.2025 → 2025-06-30
};

const isoToUi = (iso = "") => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`; // 2025-06-30 → 30.06.2025
};

/* компонент ──────────────────────────────────────────── */
const DatePicker = forwardRef(
  ({ value = "", onChange, className = "", ...rest }, ref) => {
    /** value приходить у вигляді DD.MM.YYYY */
    const isoValue = uiToIso(value); // віддаємо у hidden <input type="date">

    const handleNative = (e) => {
      const iso = e.target.value; // YYYY-MM-DD
      if (!iso) return;
      onChange?.(isoToUi(iso)); // віддаємо наверх DD.MM.YYYY
    };

    return (
      <div className={`relative ${className}`}>
        {/* 1️⃣ невидимий date-input зверху → відкриває календар */}
        <input
          type="date"
          value={isoValue}
          onChange={handleNative}
          className="absolute inset-0 z-10 cursor-pointer opacity-0 focus:outline-none"
          ref={ref}
          {...rest}
        />

        {/* 2️⃣ видиме поле із потрібним форматом (readOnly) */}
        <input
          type="text"
          value={value}
          readOnly
          className="w-full border rounded px-2 py-1 bg-white cursor-pointer"
        />
        <Calendar
          size={18}
          className="absolute right-2 top-1/2 -translate-y-1/2
               text-gray-500 pointer-events-none"
        />
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
export default DatePicker;
