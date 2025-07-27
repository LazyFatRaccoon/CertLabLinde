import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectItem } from "../ui/select";
import axios from "axios";

export function getColumns({
  tpl,
  canEdit,
  setRows,
  saveRow,
  deleteRow,
  user,
  selectionMode = false,
  selectedRows = [],
  setSelectedRows = () => {},
}) {
  const isLab = user?.roles?.includes("lab");
  const isManager = user?.roles?.includes("manager");

  const selectionColumn = {
    id: "select",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const r = row.original;
      if (!r || r.type !== "main" || r.isDeleted) return null;

      const checked = selectedRows.includes(r.id);
      return (
        <div className="flex justify-center items-center h-full">
          <input
            id={`select-${r.id}`}
            type="checkbox"
            checked={checked}
            onChange={() => {
              setSelectedRows((prev) =>
                checked ? prev.filter((id) => id !== r.id) : [...prev, r.id]
              );
            }}
            className="w-4 h-4 accent-[var(--color-primary)]"
          />
        </div>
      );
    },
  };

  const fieldCols = tpl.fields
    .filter((f) => f.type !== "img" && f.type !== "selectOnce")
    .map((f) => ({
      header: f.label,
      id: `field_${f.id}`,
      accessorFn: (row) => (row.type === "main" ? row.data?.[f.id] ?? "" : ""),
      cell: ({ row, getValue }) => {
        const r = row.original;
        const val = getValue();
        const isEditing = r.isEditing;
        const disabled = r.isDeleted || (!r.isDraft && !canEdit);
        const canChange = !disabled && (r.isDraft || canEdit);

        if (r.type === "log") {
          if (f.label === "Дата проведення аналізу")
            return new Date(r.createdAt).toLocaleString();
          if (f.label === "Аналіз провів") return r.editor?.email ?? "—";
          const before = r.diff?.before?.[f.id];
          const after = r.diff?.after?.[f.id];
          return before !== after ? `${before ?? "—"} → ${after ?? "—"}` : "";
        }

        if (f.type === "select" && canChange && isEditing) {
          return (
            <Select
              value={val}
              onValueChange={(v) => {
                setRows((arr) =>
                  arr.map((x) =>
                    x.id === r.id
                      ? { ...x, data: { ...x.data, [f.id]: v }, isDirty: true }
                      : x
                  )
                );
              }}
              className="text-sm h-full"
            >
              <SelectItem value="">—</SelectItem>
              {(f.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </Select>
          );
        }

        if (f.type !== "select" && canChange && isEditing) {
          return (
            <Input
              className="text-sm h-full"
              value={val}
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
          );
        }

        return <div className="flex items-center h-full">{val}</div>;
      },
    }));

  return [
    ...(selectionMode ? [selectionColumn] : []),
    {
      header: "#",
      id: "rowIndex",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return r.type === "main"
          ? r.sortKey + 1
          : `${r.parentSort + 1}.${(r.logIndex ?? 0) + 1}`;
      },
    },
    ...fieldCols,
    {
      header: "",
      id: "actions",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        if (r.type === "log" || r.isDeleted) return null;

        const dirty = r.isDraft || r.isDirty;
        const canSave = (isLab && r.isDraft) || (isManager && dirty);
        const batch = tpl.fields.find((f) => f.label === "Партія");
        const date = tpl.fields.find(
          (f) => f.label === "Дата проведення аналізу"
        );

        const batchVal = r.data?.[batch?.id] ?? "";
        const dateVal = r.data?.[date?.id] ?? "";

        const handleDownloadCert = async () => {
          try {
            const res = await axios.post(
              "/api/public/certificates",
              {
                templateName: tpl.name,
                batch: batchVal,
                date: dateVal,
              },
              { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(res.data);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Сертифікат_${
              tpl.name
            }_${batchVal}_${dateVal.replaceAll(".", "")}.pdf`;
            a.click();
          } catch (e) {
            alert("Помилка завантаження сертифіката");
          }
        };

        return (
          <div className="flex gap-1 justify-center items-center">
            {isManager && (
              <Button
                size="sm"
                variant={r.isEditing ? "secondary" : "outline"}
                className={
                  r.isDraft
                    ? "bg-[var(--color-primary)] pointer-events-none"
                    : r.isEditing
                    ? "bg-[var(--color-primary)]"
                    : ""
                }
                onClick={() =>
                  setRows((arr) =>
                    arr.map((x) =>
                      x.id === r.id ? { ...x, isEditing: !x.isEditing } : x
                    )
                  )
                }
                disabled={r.isDraft}
              >
                ✏️
              </Button>
            )}

            <Button
              size="sm"
              disabled={!dirty || !canSave}
              className={!dirty || !canSave ? "pointer-events-none" : ""}
              onClick={() => {
                saveRow({ ...r, isEditing: false });
                setRows((arr) =>
                  arr.map((x) =>
                    x.id === r.id ? { ...x, isEditing: false } : x
                  )
                );
              }}
            >
              💾
            </Button>
            {!r.isDraft && (
              <Button size="sm" variant="ghost" onClick={handleDownloadCert}>
                📄
              </Button>
            )}
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
