import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "@/api/axiosInstance";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "react-toastify";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";

function useCurrentUser() {
  // читаємо те, що поклали в localStorage після login
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") ?? "null") || {};
    } catch {
      return {};
    }
  });

  /* якщо хтось у сусідній вкладці перезапише localStorage — оновимось */
  useEffect(() => {
    const sync = (e) => {
      if (e.key === "user") {
        try {
          setUser(JSON.parse(e.newValue ?? "null") || {});
        } catch {
          setUser({});
        }
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return user; // { id, name, roles, … } | {}
}
const PRODUCTS = [
  "Оксиген медичний",
  "Азот",
  "Аргон",
  "Гелій",
  "Вуглекислий газ",
];

export default function AnalysisTable({ tpl, rows = [], setRows }) {
  const user = useCurrentUser();
  const canEdit =
    user.roles.includes("manager") || user.roles.includes("supervisor");
  /* ─────── допоміжні мапи для швидкого доступу до id полів ─────── */

  /* ─────── «+ Додати» ─────── */
  const addDraft = () => {
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
      { id: "_draft_" + Date.now(), tplId: tpl.id, data: blank, isDraft: true },
      ...r,
    ]);
  };

  /* ─────── CRUD ─────── */
  const saveRow = useCallback(
    async (row) => {
      try {
        if (row.isDraft) {
          const { data: newRec } = await api.post("/analyses", {
            templateId: tpl.id,
            data: row.data,
          });
          setRows((r) => r.map((x) => (x === row ? newRec : x)));
        } else {
          const { data: upd } = await api.put(`/analyses/${row.id}`, {
            data: row.data,
          });
          setRows((r) => r.map((x) => (x.id === upd.id ? upd : x)));
        }
        toast.success("Збережено");
      } catch {
        toast.error("Помилка збереження");
      }
    },
    [tpl, setRows]
  );

  const deleteRow = useCallback(
    async (row) => {
      if (!canEdit) return;
      if (!window.confirm("Видалити запис?")) return;
      await api.delete(`/analyses/${row.id}`);
      setRows((r) => r.filter((x) => x.id !== row.id));
    },
    [canEdit, setRows]
  );

  /* ─────── table-data під tanstack/react-table ─────── */
  const tableData = useMemo(
    () =>
      rows.map((r, idx) => ({
        ...r,
        index: rows.length - idx, // нумерація
      })),
    [rows]
  );

  /* генерація колонок із шаблону */
  const columns = useMemo(() => {
    const base = [
      { header: "#", accessorKey: "index", enableSorting: false },
      ...tpl.fields
        .filter((f) => f.type !== "img")
        .map((f) => ({
          header: f.label,
          accessorFn: (row) => row.data?.[f.id] ?? "", // ← fallback
          cell: ({ row, getValue }) => {
            const rowObj = row.original;
            const val = getValue() ?? "";
            const canChange = rowObj.isDraft || canEdit;

            /* select для «Продукт» */
            if (f.label === "Продукт" && canChange) {
              return (
                <select
                  className="border px-1 py-0.5 text-sm"
                  value={val}
                  onChange={(e) => {
                    const v = e.target.value;
                    setRows((r) =>
                      r.map((x) =>
                        x.id === rowObj.id
                          ? { ...x, data: { ...x.data, [f.id]: v } }
                          : x
                      )
                    );
                  }}
                >
                  <option value="">—</option>
                  {PRODUCTS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              );
            }

            /* текстове редагування */
            if (f.type === "select" || f.type === "calc" || !canChange) {
              return val;
            }

            return (
              <Input
                className="text-sm"
                value={val}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((r) =>
                    r.map((x) =>
                      x.id === rowObj.id
                        ? { ...x, data: { ...x.data, [f.id]: v } }
                        : x
                    )
                  );
                }}
              />
            );
          },
        })),
      {
        header: "",
        accessorKey: "actions",
        enableSorting: false,
        cell: ({ row }) => {
          if (!canEdit) return null;
          const r = row.original;
          return (
            <div className="flex gap-1">
              <Button size="sm" onClick={() => saveRow(r)}>
                💾
              </Button>
              {!r.isDraft && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteRow(r)}
                >
                  ✕
                </Button>
              )}
            </div>
          );
        },
      },
    ];
    return base;
  }, [tpl, canEdit, saveRow, deleteRow, setRows]);

  /* ——— table instance ——— */
  const [globalFilter, setGlobalFilter] = useState("");
  const table = useReactTable({
    data: tableData,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  /* пагінація по 50 */
  useEffect(() => table.setPageSize(50), [table]);

  /* ─────── render ─────── */
  return (
    <div className="flex-1 flex flex-col overflow-auto p-4">
      {/* top-bar */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold">{tpl.name}</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Пошук…"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="text-sm"
          />
          <Button onClick={addDraft}>+ Додати аналіз</Button>
        </div>
      </div>

      {/* table */}
      <div className="overflow-auto border rounded">
        <table className="table-auto w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="border px-2 py-1 cursor-pointer select-none"
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
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id}>
                {r.getVisibleCells().map((c) => (
                  <td key={c.id} className="border px-1 py-0.5 align-top">
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* pagination controls */}
      <div className="flex justify-between items-center mt-2">
        <Button
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          ←
        </Button>
        <span>
          Сторінка {table.getState().pagination.pageIndex + 1} із{" "}
          {table.getPageCount()}
        </span>
        <Button
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          →
        </Button>
      </div>
    </div>
  );
}
