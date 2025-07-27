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

export default function UserLogs() {
  const [logs, setLogs] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const token = localStorage.getItem("token");

  const cleanEmail = (email = "") => email.split("#deleted_")[0];
  const isDeleted = (email = "") => email.includes("#deleted_");

  useEffect(() => {
    api.get("/logs/users").then((r) => setLogs(r.data));
  }, [token]);

  const data = useMemo(() => {
    return logs.map((l, i) => {
      const oldObj = JSON.parse(l.oldValue || "{}");
      const newObj = JSON.parse(l.newValue || "{}");

      const filteredKeys = Object.keys(newObj).filter((k) => k !== "email");
      const changeLines = filteredKeys
        .map((k) => `${k}: ${oldObj[k] ?? "-"} → ${newObj[k] ?? "-"}`)
        .join("\n");
      const fields = l.action === "create" ? "" : filteredKeys.join(",");

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
            ? "text-red-500"
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
            ? "text-red-500"
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
          <div className="whitespace-pre-line text-sm ">{getValue()}</div>
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
    <div className="p-4 ">
      <h2 className="text-2xl font-bold mb-4">Журнал змін користувачів</h2>
      <label htmlFor="search">
        <input
          id="search"
          name="search"
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Пошук..."
          className="mb-4 border  p-2 rounded w-full"
          autoComplete="off"
        />
      </label>
      <div className="overflow-x-auto">
        <table className="table-auto w-full ">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr
                key={hg.id}
                className=" border border-[var(--color-bg)] bg-[var(--color-bg)] text-[var(--color-text)]"
              >
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className=" px-2 py-1 cursor-pointer text-left"
                    onClick={h.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === "asc" ? (
                        <span className="text-[var(--color-accent)]">▲</span>
                      ) : h.column.getIsSorted() === "desc" ? (
                        <span className="text-[var(--color-accent)]">▼</span>
                      ) : null}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="even:bg-[var(--color-bg-light)]">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="border border-[var(--color-text)]  px-2 py-1 align-top"
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
            className="px-4 py-2 bg-[var(--color-secondary)] rounded disabled:opacity-50"
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
            className="px-4 py-2 bg-[var(--color-secondary)] rounded disabled:opacity-50"
          >
            Вперед
          </button>
        </div>
      </div>
    </div>
  );
}
