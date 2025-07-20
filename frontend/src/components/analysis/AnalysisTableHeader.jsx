import { Input } from "../ui/input";
import { Button } from "../ui/button";
import PeriodFilter from "./PeriodFilter";
import { useState } from "react";
import axios from "axios";
import { FileCheck2, FileDown } from "lucide-react";

export default function AnalysisTableHeader({
  tpl,
  isSupervisor,
  showLogs,
  setShowLogs,
  globalFilter,
  setGlobalFilter,
  mayAdd,
  addDraft,
  periodParams,
  setPeriodParams,
  selectionMode,
  setSelectionMode,
  selectedRows,
  clearSelectedRows,
}) {
  const [actionStep, setActionStep] = useState(0);

  const handleCertZipClick = async () => {
    if (!selectionMode) {
      setSelectionMode(true);
      setActionStep(1);
      return;
    }

    if (actionStep === 1) {
      if (!selectedRows.length) {
        alert("Оберіть хоча б один запис");
        return;
      }

      try {
        const res = await axios.post(
          "/api/certificates/zip",
          { ids: selectedRows },
          { responseType: "blob" }
        );

        const blob = new Blob([res.data], { type: "application/zip" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `certificates_${Date.now()}.zip`;
        a.click();

        clearSelectedRows();
        setSelectionMode(false);
        setActionStep(0);
      } catch (err) {
        console.error("Помилка завантаження архіву", err);
        alert("Не вдалося згенерувати архів");
      }
    }
  };

  return (
    <div className="flex gap-5 justify-between items-center mb-3">
      <h2 className="text-xl font-bold">{tpl.name}</h2>
      <PeriodFilter onChange={setPeriodParams} initial={periodParams} />
      <div className="flex gap-3 items-center">
        {isSupervisor && (
          <label
            htmlFor="showChanges"
            className="flex items-center gap-1 text-sm select-none"
          >
            <input
              type="checkbox"
              name="showChanges"
              id="showChanges"
              checked={showLogs}
              onChange={(e) => setShowLogs(e.target.checked)}
            />
            Показати зміни
          </label>
        )}

        <label htmlFor="search">
          <Input
            name="search"
            id="search"
            placeholder="Пошук…"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="text-sm"
          />
        </label>

        <Button onClick={handleCertZipClick} variant="secondary">
          {actionStep === 1 ? (
            <>
              <FileDown className="w-4 h-4 mr-1" />
              Завантажити ZIP
            </>
          ) : (
            <>
              <FileCheck2 className="w-4 h-4 mr-1" />
              Обрати сертифікати
            </>
          )}
        </Button>

        {mayAdd && <Button onClick={addDraft}>+ Додати аналіз</Button>}
      </div>
    </div>
  );
}
