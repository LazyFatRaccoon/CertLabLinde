import { useEffect, useState } from "react";
import FileUploader from "../users/FileUploader";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { api } from "../../api/axiosInstance";
import { PUBLIC_URL } from "../../constants";
import FieldTable from "./FieldTable";

function createSystemFields(products, locations) {
  return [
    {
      id: crypto.randomUUID(),
      label: "Підпис",
      type: "img",
      fixed: true,
      demo: "",
      x: 0,
      y: 0,
      size: 100,
    },
    {
      id: crypto.randomUUID(),
      label: "Печатка",
      type: "img",
      fixed: true,
      demo: "",
      x: 0,
      y: 0,
      size: 200,
    },
    {
      id: crypto.randomUUID(),
      label: "Дата проведення аналізу",
      type: "calc",
      fixed: true,
      demo: "01.07.2025",
      x: 0,
      y: 0,
    },
    {
      id: crypto.randomUUID(),
      label: "Аналіз провів",
      type: "calc",
      fixed: true,
      demo: "П. І. Б.",
      x: 0,
      y: 0,
    },
    {
      id: crypto.randomUUID(),
      label: "Партія",
      type: "text",
      fixed: true,
      demo: "123-XYZ",
      x: 0,
      y: 0,
    },
    {
      id: crypto.randomUUID(),
      label: "Продукт",
      type: "selectOnce",
      fixed: true,
      options: normalizeSelectOptions(products),
      render: false,
    },
    {
      id: crypto.randomUUID(),
      label: "Локація",
      type: "selectOnce",
      fixed: true,
      options: normalizeSelectOptions(locations),
      render: false,
    },
  ];
}

const normalizeSelectOptions = (raw) => {
  if (Array.isArray(raw) && raw.length > 0) {
    const val = raw[0];
    return typeof val === "object" && val.id ? [val.id] : [val];
  }
  if (typeof raw === "string") return [raw];
  return [];
};

export default function TemplateForm({ draft, setDraft, onSave, onDelete }) {
  const [activeFieldId, setActiveId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [initialDraft, setInitialDraft] = useState(null);

  const rawProducts = JSON.parse(localStorage.getItem("products")) || [];
  const rawLocations = JSON.parse(localStorage.getItem("locations")) || [];

  useEffect(
    () => () => {
      if (draft.bgPreview) URL.revokeObjectURL(draft.bgPreview);
    },
    [draft.bgPreview]
  );

  useEffect(() => {
    api.get("/auth/me").then(({ data }) => setCurrentUser(data));
  }, []);

  useEffect(() => {
    if (!draft.id && draft.fields.length === 0) {
      setTimeout(() => {
        setDraft((d) => {
          const filled = {
            ...d,
            fields: createSystemFields(rawProducts, rawLocations),
          };
          setInitialDraft(filled);
          return filled;
        });
      }, 0);
    } else {
      setInitialDraft(draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id, draft.fields.length]);

  const width = 600;
  const height = width * 1.414;

  const stampUrl = `${PUBLIC_URL}/public/stamp.png`;
  const signUrl = currentUser?.signature
    ? `${PUBLIC_URL}/public/${currentUser.signature}`
    : "";

  const overlayFields = draft.fields
    .filter((f) => f.render !== false)
    .map((f) => {
      if (f.label === "Печатка" && stampUrl)
        return { ...f, imageUrl: stampUrl };
      if (f.label === "Підпис" && signUrl) return { ...f, imageUrl: signUrl };
      return f;
    });

  const handlePick = (x, y) => {
    if (!activeFieldId) return;
    setDraft((d) => ({
      ...d,
      fields: d.fields.map((f) =>
        f.id === activeFieldId ? { ...f, x, y } : f
      ),
    }));
    setActiveId(null);
  };

  const addField = () =>
    setDraft((d) => ({
      ...d,
      fields: [
        ...d.fields,
        {
          id: crypto.randomUUID(),
          label: "Нове поле",
          type: "text",
          x: 0,
          y: 0,
        },
      ],
    }));

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  return (
    <div className="flex flex-col flex-1  gap-2 ">
      <div className="flex flex-row justify-between gap-2 items-center">
        <label htmlFor="templateName">
          <Input
            id="templateName"
            name="templateName"
            className="flex-1"
            placeholder="Назва шаблону"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </label>
        <div className="flex justify-between gap-2 items-center ">
          {draft.id && (
            <Button
              variant="destructive"
              onClick={() => {
                if (window.confirm("Ви впевнені, що хочете видалити шаблон?")) {
                  onDelete(draft.id);
                }
              }}
            >
              Видалити
            </Button>
          )}

          <Button type="button" onClick={addField}>
            + Поле
          </Button>
          {hasChanges && (
            <Button
              type="button"
              onClick={() => {
                const cleanedDraft = {
                  ...draft,
                  fields: draft.fields.map((f) => {
                    if (
                      ["Продукт", "Локація"].includes(f.label) &&
                      f.type === "selectOnce"
                    ) {
                      const val = f.options?.[0];
                      if (typeof val === "object")
                        return { ...f, options: [val.id] };

                      if (typeof val === "string") {
                        const list =
                          f.label === "Локація" ? rawLocations : rawProducts;
                        const matched = list.find((item) => item.name === val);
                        if (matched) return { ...f, options: [matched.id] };
                      }
                    }
                    return f;
                  }),
                };

                onSave(cleanedDraft);
              }}
              disabled={!hasChanges}
            >
              Зберегти
            </Button>
          )}
        </div>
      </div>

      <FieldTable
        fields={draft.fields}
        onChange={(fields) => setDraft({ ...draft, fields })}
        onSetActive={setActiveId}
      />

      <FileUploader
        accept={["image/png", "image/jpeg", "application/pdf"]}
        previewWidth={width}
        previewHeight={height}
        removable={false}
        initialUrl={draft.bgFile ? `${PUBLIC_URL}${draft.bgFile}` : ""}
        verticalFlex={true}
        onChange={(file) => {
          if (file) {
            const objUrl = URL.createObjectURL(file);
            setDraft({ ...draft, bgFileFile: file, bgPreview: objUrl });
          }
        }}
        onPick={handlePick}
        overlayFields={overlayFields}
      />
    </div>
  );
}
