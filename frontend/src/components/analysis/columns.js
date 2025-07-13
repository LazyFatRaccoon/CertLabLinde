import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { products } from "../../constants";

export function getColumns({
  tpl,
  canEdit,
  setRows,
  saveRow,
  deleteRow,
  user,
}) {
  const isLab = user?.roles?.includes("lab");
  const isManager = user?.roles?.includes("manager");

  const fieldCols = tpl.fields
    .filter((f) => f.type !== "img")
    .map((f) => ({
      header: f.label,
      accessorFn: (row) => (row.type === "main" ? row.data?.[f.id] ?? "" : ""),
      cell: ({ row, getValue }) => {
        const r = row.original;
        const val = getValue();

        if (r.type === "log") {
          if (f.label === "Дата проведення аналізу")
            return new Date(r.createdAt).toLocaleString();
          if (f.label === "Аналіз провів") return r.editor?.email ?? "—";
          const before = r.diff?.before?.[f.id];
          const after = r.diff?.after?.[f.id];
          return before !== after ? `${before ?? "—"} → ${after ?? "—"}` : "";
        }

        const disabled = r.isDeleted || (!r.isDraft && !canEdit);
        const canChange = !disabled && (r.isDraft || canEdit);

        if (f.label === "Продукт" && canChange) {
          return (
            <div className="flex items-center h-full">
              <select
                className="border px-1 py-0.5 text-sm disabled:opacity-50 h-full"
                disabled={disabled}
                name={`select-${f.id}`}
                value={val}
                onChange={(e) => {
                  const v = e.target.value;
                  setRows((arr) =>
                    arr.map((x) =>
                      x.id === r.id
                        ? {
                            ...x,
                            data: { ...x.data, [f.id]: v },
                            isDirty: true,
                          }
                        : x
                    )
                  );
                }}
              >
                <option value="">—</option>
                {products.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          );
        }

        if (f.type === "select" || f.type === "calc" || !canChange)
          return <div className="flex items-center h-full">{val}</div>;

        return (
          <div className="flex items-center h-full">
            <Input
              className="text-sm disabled:opacity-50 h-full"
              disabled={disabled}
              value={val}
              name={`field-${f.id}`}
              onChange={(e) => {
                const v = e.target.value;
                setRows((arr) =>
                  arr.map((x) =>
                    x.id === r.id
                      ? { ...x, data: { ...x.data, [f.id]: v }, isDirty: true }
                      : x
                  )
                );
              }}
            />
          </div>
        );
      },
    }));

  return [
    {
      header: "#",
      id: "_rowIndex",
      //accessorFn: (_, i) => i,
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        //if (r.type === "main") return `${r.sortKey}`;
        if (r.type === "main") return r.sortKey + 1;
        //if (r.type === "log") return `${r.parentSort}.${r.logIndex}`;
        return `${r.parentSort + 1}.${(r.logIndex ?? 0) + 1}`;
        //return "";
      },
    },
    ...fieldCols,
    {
      header: "",
      accessorKey: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        if (r.type === "log" || r.isDeleted) return null;
        const dirty = r.isDraft || r.isDirty;
        const canSave = (isLab && r.isDraft) || (isManager && dirty);
        return (
          <div className="flex gap-1 justify-center items-center">
            <Button
              size="sm"
              disabled={!dirty || !canSave}
              className={!dirty || !canSave ? "pointer-events-none" : ""}
              onClick={() => saveRow(r)}
            >
              💾
            </Button>
            {!r.isDraft && isManager && (
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
}
