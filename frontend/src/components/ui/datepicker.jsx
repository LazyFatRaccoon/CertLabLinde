// src/components/ui/DatePicker.jsx
import { forwardRef, useRef } from "react";
import { Calendar } from "lucide-react";

/* helpers ──────────────────────────────── */
/* компонент ────────────────────────────── */
export const DatePicker = forwardRef(
  (
    { value = "", onChange, fullWidth = true, className = "", ...rest },
    refFromParent
  ) => {
    const innerRef = useRef();
    const inputRef = refFromParent ?? innerRef;

    const todayUi = () =>
      new Date().toLocaleDateString("uk-UA").replace(/\//g, ".");

    const uiToIso = (ui = "") => {
      const [d, m, y] = ui.split(".");
      return d && m && y
        ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
        : "";
    };

    const isoToUi = (iso = "") => {
      if (!iso) return "";
      const [y, m, d] = iso.split("-");
      return `${d}.${m}.${y}`;
    };

    const uiValue = value || todayUi();
    const isoValue = uiToIso(uiValue);

    const handleNative = (e) => {
      const iso = e.target.value;
      if (iso) onChange?.(isoToUi(iso));
    };

    const openCalendar = () => {
      const el = inputRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.showPicker?.();
    };
    const style = className
      ? className
      : "border rounded pl-2 pr-14 py-2 bg-[var(--color-bg)] text-[var(--color-text)] cursor-pointer select-none hover:border-[var(--color-primary)] transition-colors";
    return (
      <div
        className={`relative ${className} group ${
          fullWidth ? "w-full" : ""
        } ${style}`}
        onClick={openCalendar}
      >
        <span>{uiValue}</span>
        <Calendar
          size={24}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 "
        />
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
            className="absolute inset-0 opacity-0 pointer-events-none focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
        </label>
      </div>
    );
  }
);

DatePicker.displayName = "DatePicker";
export default DatePicker;
