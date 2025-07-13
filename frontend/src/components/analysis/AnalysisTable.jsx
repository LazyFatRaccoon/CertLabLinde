import { useState, useMemo, useEffect, useCallback } from "react";
import { api } from "@/api/axiosInstance";
import { toast } from "react-toastify";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { flattenRows } from "../../utils/flattenRows";
import { getColumns } from "./columns";
import AnalysisTableHeader from "./AnalysisTableHeader";
import AnalysisTableBody from "./AnalysisTableBody";

export default function AnalysisTable({ tpl, rows = [], setRows }) {
  const user = useCurrentUser();
  const isSupervisor = user.roles.includes("supervisor");
  const canEdit = isSupervisor || user.roles.includes("manager");
  const mayAdd = canEdit || user.roles.includes("lab");

  const [showLogs, setShowLogs] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  const addDraft = () => {
    if (!mayAdd) return;
    const blank = {};
    tpl.fields
      .filter((f) => f.type !== "img")
      .forEach((f) => {
        if (f.label === "Дата проведення аналізу")
          blank[f.id] = new Date().toLocaleDateString("uk-UA");
        else if (f.label === "Аналіз провів") blank[f.id] = user.name || "";
        else if (f.label === "Email") blank[f.id] = user.email || "";
        else blank[f.id] = "";
      });
    setRows((r) => [
      {
        id: "_draft_" + Date.now(),
        tplId: tpl.id,
        data: blank,
        isDraft: true,
        isDirty: true,
      },
      ...r,
    ]);
  };

  const saveRow = useCallback(
    async (row) => {
      try {
        let saved;
        if (row.isDraft) {
          const { data } = await api.post("/analyses", {
            templateId: tpl.id,
            data: row.data,
          });
          saved = { ...data, isDraft: false, isDirty: false };
        } else {
          const { data } = await api.put(`/analyses/${row.id}`, {
            data: row.data,
          });
          saved = { ...data, isDirty: false }; // ← скидаємо прапорець
        }

        setRows((r) =>
          r.map((x) => (x.id === row.id || x === row ? saved : x))
        );
        toast.success("Збережено");
      } catch {
        toast.error("Помилка збереження");
      }
    },
    [tpl, setRows]
  );

  const deleteRow = useCallback(
    async (row) => {
      if (!canEdit || row.type === "log") return;
      if (!window.confirm("Видалити запис?")) return;
      await api.delete(`/analyses/${row.id}`);
      setRows((r) =>
        r.map((x) => (x.id === row.id ? { ...x, deletedAt: Date.now() } : x))
      );
    },
    [canEdit, setRows]
  );

  const tableData = useMemo(
    () => flattenRows({ rows, showLogs, isSupervisor }),
    [rows, showLogs, isSupervisor]
  );

  const columns = useMemo(
    () => getColumns({ tpl, canEdit, setRows, saveRow, deleteRow, user }),
    [tpl, canEdit, setRows, saveRow, deleteRow, user]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  useEffect(() => table.setPageSize(50), [table]);

  return (
    <div className="p-4">
      <AnalysisTableHeader
        tpl={tpl}
        isSupervisor={isSupervisor}
        showLogs={showLogs}
        setShowLogs={setShowLogs}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        mayAdd={mayAdd}
        addDraft={addDraft}
      />
      <AnalysisTableBody table={table} data={tableData} />
    </div>
  );
}
