import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { api } from "../../api/axiosInstance";

export default function TemplateLogs() {
  const [logs, setLogs] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  useEffect(() => {
    api
      .get("/logs/templates")
      .then((r) => setLogs(r.data))
      .catch((e) => console.error("Failed to fetch template logs", e));
  }, []);

  const data = useMemo(() => {
    return logs.map((log, i) => {
      const { action, diff = {}, editor, editorId, createdAt } = log;

      const before = diff?.before ?? {};
      const after = diff?.after ?? {};
      const rawName = diff?.name ?? before?.name ?? after?.name;
      const templateName = rawName || "(без назви)";

      const fieldsToCheck = ["name", "bgFile", "location", "product"];
      const changed = [];
      const fieldChanges = [];

      if (action === "update") {
        fieldsToCheck.forEach((k) => {
          const b = JSON.stringify(before?.[k] ?? null);
          const a = JSON.stringify(after?.[k] ?? null);
          if (b !== a) changed.push(k);
        });

        if (Array.isArray(after.fields)) {
          after.fields.forEach((label) => {
            if (!changed.includes(label)) changed.push(label);
          });
        }
      }

      return {
        index: i + 1,
        timestamp: new Date(createdAt).toLocaleString(),
        action,
        templateName,
        color:
          action === "create"
            ? "text-green-600"
            : action === "delete"
            ? "text-red-600"
            : "",
        editorInfo: editor
          ? editor.name || editor.email || `ID ${editor.id}`
          : `ID ${editorId}`,
        fields: changed.length ? changed.join(", ") : "–",
        changeLines:
          action === "create" || action === "delete"
            ? [
                `Назва: ${diff?.name || before?.name || "–"}`,
                `Локація: ${diff?.location || before?.location || "–"}`,
                `Продукт: ${diff?.product || before?.product || "–"}`,
              ].join("\n")
            : changed.length
            ? [
                ...changed
                  .filter((k) => fieldsToCheck.includes(k))
                  .map(
                    (k) =>
                      `${k}: ${
                        before?.[k] !== undefined
                          ? JSON.stringify(before[k])
                          : "–"
                      } → ${
                        after?.[k] !== undefined
                          ? JSON.stringify(after[k])
                          : "–"
                      }`
                  ),
                ...fieldChanges.map(
                  ({ label, before, after }) =>
                    `Поле '${label}': ${
                      before ? JSON.stringify(before) : "–"
                    } → ${after ? JSON.stringify(after) : "–"}`
                ),
              ].join("\n")
            : "–",
      };
    });
  }, [logs]);

  const columns = useMemo(
    () => [
      { header: "#", accessorKey: "index" },
      { header: "Час", accessorKey: "timestamp" },
      {
        header: "Шаблон",
        accessorKey: "templateName",
        cell: ({ row }) => (
          <span className={row.original.color}>
            {row.original.templateName}
          </span>
        ),
      },
      {
        header: "Хто змінював",
        accessorKey: "editorInfo",
        cell: ({ row }) => (
          <span className={row.original.color}>{row.original.editorInfo}</span>
        ),
      },
      { header: "Дія", accessorKey: "action" },
      { header: "Поля", accessorKey: "fields" },
      {
        header: "Зміни",
        accessorKey: "changeLines",
        cell: ({ getValue }) => (
          <div style={{ whiteSpace: "pre-line" }}>{getValue()}</div>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-4">Журнал змін шаблонів</h2>
      <input
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Пошук..."
        className="mb-4 border p-2 rounded w-full"
      />
      <div className="overflow-x-auto">
        <table className="table-auto w-full">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className="bg-[var(--color-bg)] text-[var(--color-text)]"
              >
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="border px-2 py-1 cursor-pointer"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === "asc"
                      ? " ▲"
                      : h.column.getIsSorted() === "desc"
                      ? " ▼"
                      : ""}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border px-2 py-1 align-top border-[var(--color-text)]"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between mt-4">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Назад
          </button>
          <span>
            Сторінка {table.getState().pagination.pageIndex + 1} з{" "}
            {table.getPageCount()}
          </span>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Вперед
          </button>
        </div>
      </div>
    </div>
  );
}
