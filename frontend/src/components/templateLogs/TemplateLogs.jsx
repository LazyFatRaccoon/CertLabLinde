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
  const token = localStorage.getItem("token");

  /* ─── fetch ─── */
  useEffect(() => {
    api
      .get("/logs/templates")
      .then((r) => setLogs(r.data))
      .catch((e) => console.error("Failed to fetch template logs", e));
  }, [token]);

  /* ─── transform ─── */
  const data = useMemo(() => {
    return logs.map((l, i) => {
      const before = l.diff?.before || {};
      const after = l.diff?.after || {};
      const firstName = typeof l.diff?.name === "string" ? l.diff.name : null;

      /* тільки реально змінені ключі */
      const changed = ["name", "bgFile"].filter((k) => before[k] !== after[k]);

      return {
        index: i + 1,
        timestamp: new Date(l.createdAt).toLocaleString(),
        action: l.action,
        /* назва шаблона (для delete беремо «before») */
        templateName:
          l.action === "delete"
            ? before.name || "(без назви)"
            : l.action === "create"
            ? firstName || "(без назви)"
            : after.name || "(без назви)",
        /* клас кольору для комірок */
        color:
          l.action === "create"
            ? "text-green-600"
            : l.action === "delete"
            ? "text-red-600"
            : "",
        /* хто редагував */
        editorInfo: l.editor
          ? l.editor.name || l.editor.email || `ID ${l.editor.id}`
          : `ID ${l.editorId}`,
        /* список змінених полів */
        fields: changed.length ? changed.join(", ") : "–",
        /* текст «було → стало» */
        changeLines: changed.length
          ? changed
              .map((k) => `${k}: ${before[k] ?? "–"} → ${after[k] ?? "–"}`)
              .join("\n")
          : "–",
      };
    });
  }, [logs]);

  /* ─── columns ─── */
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

  /* ─── table instance ─── */
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

  /* ─── render ─── */
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Журнал змін шаблонів</h2>
      <label htmlFor="search">
        <input
          id="search"
          name="search"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Пошук..."
          className="mb-4 border p-2 rounded w-full"
        />
      </label>
      <div className="overflow-x-auto">
        <table className="table-auto w-full border">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-gray-100">
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="border px-2 py-1 cursor-pointer"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {h.column.getIsSorted() === "asc"
                      ? " 🔼"
                      : h.column.getIsSorted() === "desc"
                      ? " 🔽"
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
                  <td key={cell.id} className="border px-2 py-1 align-top">
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
