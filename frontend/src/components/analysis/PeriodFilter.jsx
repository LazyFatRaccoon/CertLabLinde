import React, { useRef, useEffect, useState, useMemo } from "react";
import DatePicker from "../ui/datepicker";
import { RefreshCw } from "lucide-react";

const options = [
  { label: "За сьогодні", value: "today" },
  { label: "За тиждень", value: "week" },
  { label: "За місяць", value: "month" },
  { label: "За рік", value: "year" },
  { label: "За весь час", value: "all" },
  { label: "Обрати діапазон", value: "range" },
];

const todayUI = () => new Date().toLocaleDateString("uk-UA");

export default function PeriodFilter({ onChange, initial }) {
  const init = useMemo(() => {
    if (initial) return initial;

    try {
      const raw = localStorage.getItem("analysisPeriodParams");
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        period: parsed.period || "week",
        from: parsed.from || todayUI(),
        to: parsed.to || todayUI(),
      };
    } catch {
      return {
        period: "week",
        from: todayUI(),
        to: todayUI(),
      };
    }
  }, [initial]);

  const [period, setPeriod] = useState(init.period);
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  const [rangeDirty, setRangeDirty] = useState(false);
  const didMount = useRef(false);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }

    const saved = localStorage.getItem("analysisPeriodParams");
    let parsed = {};

    try {
      parsed = saved ? JSON.parse(saved) : {};
    } catch {
      parsed = {};
    }

    const from = parsed.from || new Date().toLocaleDateString("uk-UA");
    const to = parsed.to || new Date().toLocaleDateString("uk-UA");

    if (period !== "range") {
      const next = { period, from, to };

      const current = JSON.stringify(parsed);
      const updated = JSON.stringify(next);

      if (current !== updated) {
        localStorage.setItem("analysisPeriodParams", updated);
        onChange(next);
      }
    } else {
      setRangeDirty(true); // показати кнопку
    }
  }, [period, onChange]);

  const handleFromChange = (val) => {
    setFrom(val);
    setRangeDirty(true);
  };

  const handleToChange = (val) => {
    setTo(val);
    setRangeDirty(true);
  };

  const fallbackDate = () => new Date().toLocaleDateString("uk-UA");

  const handleRangeSubmit = () => {
    const safeFrom = from || fallbackDate();
    const safeTo = to || fallbackDate();

    const next = { period: "range", from: safeFrom, to: safeTo };
    localStorage.setItem("analysisPeriodParams", JSON.stringify(next));
    onChange(next);
    setRangeDirty(false);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="border px-2 py-1 rounded"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {period === "range" && (
        <>
          <DatePicker
            fullWidth={false}
            value={from}
            onChange={handleFromChange}
          />
          <DatePicker fullWidth={false} value={to} onChange={handleToChange} />
          {rangeDirty && (
            <button
              className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
              onClick={handleRangeSubmit}
            >
              <RefreshCw />
            </button>
          )}
        </>
      )}
    </div>
  );
}
