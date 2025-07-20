import { useState } from "react";
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

const today = () => new Date();
const formatDate = (date) => date.toLocaleDateString("uk-UA");
const formatForPayload = (date) => date.toISOString().split("T")[0];
const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

export default function PeriodFilterSimple({ onSubmit }) {
  const [period, setPeriod] = useState("week");
  const [from, setFrom] = useState(formatDate(today()));
  const [to, setTo] = useState(formatDate(today()));

  const handleSubmit = () => {
    let payload;

    if (period === "range") {
      payload = {
        period,
        from: new Date(from).toISOString().split("T")[0],
        to: new Date(to).toISOString().split("T")[0],
      };
    } else {
      const now = today();
      let start;

      switch (period) {
        case "today":
          start = now;
          break;
        case "week":
          start = addDays(now, -7);
          break;
        case "month":
          start = addDays(now, -30);
          break;
        case "year":
          start = addDays(now, -365);
          break;
        default:
          break;
      }

      payload =
        period === "all"
          ? { period }
          : {
              period,
              from: formatForPayload(start),
              to: formatForPayload(addDays(now, 1)),
            };
    }

    onSubmit(payload);
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
          <DatePicker fullWidth={false} value={from} onChange={setFrom} />
          <DatePicker fullWidth={false} value={to} onChange={setTo} />
        </>
      )}

      <button
        className="bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
        onClick={handleSubmit}
      >
        <RefreshCw />
      </button>
    </div>
  );
}
