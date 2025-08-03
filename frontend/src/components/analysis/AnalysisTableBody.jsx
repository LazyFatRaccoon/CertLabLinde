import { flexRender } from "@tanstack/react-table";

export default function AnalysisTableBody({ table, data }) {
  const sorting = table.getState().sorting?.[0];
  const globalFilter = table.getState().globalFilter?.toLowerCase();

  const sortId = sorting?.id;
  const desc = sorting?.desc;

  const getSortValue = (row) => {
    const cell = row.getAllCells().find((c) => c.column.id === sortId);
    return cell?.getValue?.();
  };

  const getFilterHit = (row) => {
    if (!globalFilter) return true;
    return Object.values(row.original.data || {}).some((v) =>
      String(v).toLowerCase().includes(globalFilter)
    );
  };

  const parents = [];
  const childrenMap = new Map();

  data.forEach((original, index) => {
    const row = table.getRowModel().rows.find((r) => r.index === index);
    if (!row) return;

    if (original?.type === "main") {
      if (getFilterHit(row)) {
        parents.push(row);
      }
    } else if (original?.type === "log") {
      const parentSort = original.parentSort;
      if (!childrenMap.has(parentSort)) childrenMap.set(parentSort, []);
      childrenMap.get(parentSort).push(row);
    }
  });

  const parseValue = (val) => {
    if (typeof val !== "string") return val;
    const dateMatch = val.match(/\d{2}\.\d{2}\.\d{4}/);
    if (dateMatch) {
      const [day, month, year] = val.split(".").map(Number);
      return new Date(year, month - 1, day);
    }
    const numberVal = parseFloat(val.replace(/,/g, "."));
    return isNaN(numberVal) ? val : numberVal;
  };

  if (sortId) {
    parents.sort((a, b) => {
      const aVal = parseValue(getSortValue(a));
      const bVal = parseValue(getSortValue(b));

      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
      return 0;
    });
  }

  const sortedRows = [];
  parents.forEach((parent) => {
    sortedRows.push(parent);
    const parentSort = parent.original.sortKey;
    const children = childrenMap.get(parentSort) || [];
    children.sort(
      (a, b) => (a.original.logIndex ?? 0) - (b.original.logIndex ?? 0)
    );
    sortedRows.push(...children);
  });

  return (
    <>
      <div className="overflow-auto border rounded">
        <table className=" table-auto w-full text-sm">
          <thead className=" bg-[var(--color-bg)] text-[var(--color-text)] sticky top-0">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((h) => (
                  <th
                    key={h.id}
                    className="border border-[var(--color-tableBorder)] px-2 py-1 cursor-pointer select-none"
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
            {sortedRows.map((r) => (
              <tr
                key={r.id}
                data-type={r.original.type}
                className={`align-middle ${
                  r.original.type === "log"
                    ? r.original.action === "delete"
                      ? "bg-red-100"
                      : r.original.action === "create"
                      ? "bg-green-100"
                      : "bg-yellow-100"
                    : r.original.isDeleted
                    ? "bg-red-100 line-through"
                    : ""
                }`}
              >
                {r.getVisibleCells().map((c) => {
                  let content;

                  if (c.column.id === "rowIndex") {
                    const rOrig = r.original;
                    content =
                      rOrig.type === "main"
                        ? rOrig.sortKey + 1
                        : `${rOrig.parentSort + 1}.${
                            (rOrig.logIndex ?? 0) + 1
                          }`;
                  } else {
                    content = flexRender(
                      c.column.columnDef.cell,
                      c.getContext()
                    );
                  }

                  return (
                    <td
                      key={c.id}
                      className="border px-1 py-0.5 align-middle text-center"
                    >
                      <div className="flex justify-center items-center h-full">
                        {content}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex justify-between items-center mt-2">
          <button
            className="text-sm px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ←
          </button>
          <span>
            Сторінка {table.getState().pagination.pageIndex + 1} із{" "}
            {table.getPageCount()}
          </span>
          <button
            className="text-sm px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
