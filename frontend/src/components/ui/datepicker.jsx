// src/components/ui/DatePicker.jsx
import { forwardRef, useRef } from "react";
import { Calendar } from "lucide-react";

/* helpers ──────────────────────────────── */
const todayUi = () =>
  new Date()
    .toLocaleDateString("uk-UA") // 07.07.2025
    .replace(/\//g, "."); // 07.07.2025 (з крапками)

const uiToIso = (ui = "") => {
  const [d, m, y] = ui.split(".");
  return d && m && y ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : "";
};
const isoToUi = (iso = "") => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
};

/* компонент ────────────────────────────── */
const DatePicker = forwardRef(
  ({ value = "", onChange, className = "", ...rest }, refFromParent) => {
    const innerRef = useRef();
    const inputRef = refFromParent ?? innerRef;

    /* ► якщо value порожнє ─ підставляємо сьогоднішню дату */
    const uiValue = value || todayUi();
    const isoValue = uiToIso(uiValue);

    const handleNative = (e) => {
      const iso = e.target.value; // YYYY-MM-DD
      if (iso) onChange?.(isoToUi(iso));
    };

    const openCalendar = () => {
      const el = inputRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.showPicker?.();
    };

    return (
      <div
        className={`relative ${className}
                    group w-full border rounded pl-2 pr-14 py-1
                    bg-white cursor-pointer select-none
                    hover:border-blue-500 transition-colors`}
        onClick={openCalendar}
      >
        {/* відображаємо дату */}
        <span>{uiValue}</span>

        {/* іконка календаря */}
        <Calendar
          size={24}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
        />

        {/* прозорий input */}
        <label>
          <input
            id="invisibleInput"
            name="invisibleInput"
            autoComplete="off"
            ref={inputRef}
            type="date"
            value={isoValue}
            onChange={handleNative}
            {...rest}
            className="absolute inset-0 opacity-0 pointer-events-none
                     focus:outline-none
                     [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
        </label>
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
export default DatePicker;
