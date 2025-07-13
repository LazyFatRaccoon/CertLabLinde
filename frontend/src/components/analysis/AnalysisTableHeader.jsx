import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function AnalysisTableHeader({
  tpl,
  isSupervisor,
  showLogs,
  setShowLogs,
  globalFilter,
  setGlobalFilter,
  mayAdd,
  addDraft,
}) {
  return (
    <div className="flex justify-between items-center mb-3">
      <h2 className="text-xl font-bold">{tpl.name}</h2>
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
        {mayAdd && <Button onClick={addDraft}>+ Додати аналіз</Button>}
      </div>
    </div>
  );
}
