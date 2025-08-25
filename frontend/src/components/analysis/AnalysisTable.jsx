import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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

export default function AnalysisTable({
  tpl,
  rows = [],
  setRows,
  setPeriodParams,
  periodParams,
}) {
  const user = useCurrentUser();
  const isSupervisor = user.roles.includes("supervisor");
  const canEdit = isSupervisor || user.roles.includes("manager");
  const mayAdd = canEdit || user.roles.includes("lab");

  const [showLogs, setShowLogs] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const hasDraft = rows.some((r) => r.isDraft);

  const lastDraftIdRef = useRef(null);

  const clearSelectedRows = () => {
    setSelectedRows([]);
  };

  const addDraft = async () => {
    if (!mayAdd) return;
    const res = await fetch("/api/analyses/new", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const { number } = await res.json();

    const blank = {};
    tpl.fields
      .filter((f) => f.type !== "img")
      .forEach((f) => {
        if (f.label === "Дата проведення аналізу")
          blank[f.id] = new Date().toLocaleDateString("uk-UA");
        else if (f.label === "Аналіз провів") blank[f.id] = user.name || "";
        else if (f.label === "Email") blank[f.id] = user.email || "";
        else if (f.label === "№ аналізу") blank[f.id] = String(number);
        else blank[f.id] = "";
      });
    const newId = "_draft_" + Date.now();
    lastDraftIdRef.current = newId;
    setRows((r) => [
      {
        id: "_draft_" + Date.now(),
        tplId: tpl.id,
        data: blank,
        isDraft: true,
        isDirty: true,
        isEditing: true, // 👈 одразу у режимі редагування
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
    () =>
      getColumns({
        tpl,
        canEdit,
        setRows,
        saveRow,
        deleteRow,
        user,
        selectionMode,
        selectedRows,
        setSelectedRows,
      }),
    [
      tpl,
      canEdit,
      setRows,
      saveRow,
      deleteRow,
      user,
      selectionMode,
      selectedRows,
      setSelectedRows,
    ]
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

  useEffect(() => {
    const draftId = lastDraftIdRef.current;
    if (!draftId) return;

    // дочекаймося DOM
    requestAnimationFrame(() => {
      // шукаємо ПЕРШЕ редаговане поле саме цієї чернетки
      const el = document.querySelector(
        `input[data-row-id="${draftId}"]:not([disabled]):not([readonly])`
      );
      if (el) {
        el.focus();
        el.select?.();
        // одноразово — скинемо, щоб не намагатись фокуситись ще
        lastDraftIdRef.current = null;
      }
    });
  }, [rows]);

  useEffect(() => table.setPageSize(50), [table]);

  return (
    <div className="w-full">
      <AnalysisTableHeader
        tpl={tpl}
        isSupervisor={isSupervisor}
        showLogs={showLogs}
        setShowLogs={setShowLogs}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        mayAdd={mayAdd}
        addDraft={addDraft}
        hasDraft={hasDraft}
        periodParams={periodParams}
        setPeriodParams={setPeriodParams}
        selectionMode={selectionMode}
        setSelectionMode={setSelectionMode}
        selectedRows={selectedRows}
        clearSelectedRows={clearSelectedRows}
      />
      <AnalysisTableBody table={table} data={tableData} />
    </div>
  );
}
