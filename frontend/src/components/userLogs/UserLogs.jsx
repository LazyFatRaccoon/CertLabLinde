import React, { useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import axios from "axios";

export default function UserLogs() {
  const [logs, setLogs] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const token = localStorage.getItem("token");

  /* helpers */
  const cleanEmail = (email = "") => email.split("#deleted_")[0];
  const isDeleted = (email = "") => email.includes("#deleted_");

  /* fetch */
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/logs/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setLogs(r.data));
  }, [token]);

  /* transform */
  const data = useMemo(() => {
    return logs.map((l, i) => {
      const oldObj = JSON.parse(l.oldValue || "{}");
      const newObj = JSON.parse(l.newValue || "{}");

      const filteredKeys = Object.keys(newObj).filter((k) => k !== "email");
      const changeLines = filteredKeys
        .map((k) => `${k}: ${oldObj[k] ?? "-"} → ${newObj[k] ?? "-"}`)
        .join("\n");
      const fields =
        l.action === "create"
          ? "" // нічого не показуємо
          : filteredKeys.join(",");

      const editorEmailRaw = l.editor?.email ?? "unknown";
      const targetEmailRaw = l.target?.email ?? "unknown";
      const editorName = l.editor?.name ?? "?";
      const targetName = l.target?.name ?? "?";

      const editorEmail = cleanEmail(editorEmailRaw);
      const targetEmail = cleanEmail(targetEmailRaw);

      return {
        ...l,
        index: i + 1,
        timestamp: new Date(l.createdAt).toLocaleString(),
        editorInfo: `${editorEmail} (${editorName})`,
        targetInfo: `${targetEmail} (${targetName})`,
        editorDeleted: isDeleted(editorEmailRaw),
        targetDeleted: isDeleted(targetEmailRaw),
        fields,
        changeLines,
      };
    });
  }, [logs]);

  /* columns */
  const columns = useMemo(
    () => [
      { header: "#", accessorKey: "index" },
      { header: "Час", accessorKey: "timestamp" },
      {
        header: "Кого змінювали",
        accessorKey: "targetInfo",
        cell: ({ row }) => {
          const isDel = row.original.action === "delete";
          const cls = isDel
            ? "text-red-600"
            : row.original.action === "create"
            ? "text-green-600"
            : "";
          return <span className={cls}>{row.original.targetInfo}</span>;
        },
      },
      {
        header: "Хто змінював",
        accessorKey: "editorInfo",
        cell: ({ row }) => {
          const isDel = row.original.action === "delete";
          const cls = isDel
            ? "text-red-600"
            : row.original.action === "create"
            ? "text-green-600"
            : "";
          return <span className={cls}>{row.original.editorInfo}</span>;
        },
      },
      {
        header: "Дія",
        accessorKey: "action",
      },
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

  /* render */
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Журнал змін користувачів</h2>

      <input
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Пошук..."
        className="mb-4 border p-2 rounded w-full"
      />

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
