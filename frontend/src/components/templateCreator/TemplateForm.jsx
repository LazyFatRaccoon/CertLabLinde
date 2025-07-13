import { useEffect, useState } from "react";
import FileUploader from "../users/FileUploader";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { api } from "../../api/axiosInstance";
import { PUBLIC_URL } from "../../constants";

import FieldTable from "./FieldTable"; // див. нижче
//import Canvas from "./TemplateCanvas"; // поле з бекграундом

export default function TemplateForm({ draft, setDraft, onSave, onDelete }) {
  useEffect(
    () => () => {
      if (draft.bgPreview) URL.revokeObjectURL(draft.bgPreview);
    },
    [draft.bgPreview]
  );

  useEffect(() => {
    api.get("/auth/me").then(({ data }) => setCurrentUser(data));
  }, []);

  const [activeFieldId, setActiveId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (!draft.id && draft.fields.length === 0) {
      setDraft((d) => ({
        ...d,
        fields: [
          // системні поля – видаляти / перейменовувати не можна
          {
            id: crypto.randomUUID(),
            label: "Підпис",
            type: "img",
            fixed: true,
            demo: "", // заміниться картинкою
            x: 0,
            y: 0,
            size: 100, // ширина підпису у px
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
            type: "select",
            fixed: true,
            demo: "Оксиген медичний",
            x: 0,
            y: 0,
          },
        ],
      }));
    }
  }, [draft.id, draft.fields.length, setDraft]);
  // draft = { id?, name:"", bgFile:"", fields:[...] }

  const width = 600;
  const height = width * 1.414;

  const stampUrl = `${PUBLIC_URL}/public/stamp.png`; // перевіряти HEAD не обов’язково
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
    setActiveId(null); // вимикаємо режим вибору
  };
  /* --- додаємо / видаляємо поля --- */
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

  return (
    <div className="flex flex-col flex-1 p-6 gap-6">
      {/* Загальна інформація */}
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
        //setDraft({ ...draft, bgFileFile: file })}
      />

      {/* Таблиця властивостей полів */}
      <FieldTable
        fields={draft.fields}
        onChange={(fields) => setDraft({ ...draft, fields })}
        onSetActive={setActiveId}
      />

      {/* Кнопки керування */}
      <div className="flex justify-between mt-4">
        {draft.id && (
          <Button variant="destructive" onClick={() => onDelete(draft.id)}>
            Видалити
          </Button>
        )}

        <div className="space-x-2">
          <Button type="button" onClick={addField}>
            + Поле
          </Button>
          <Button type="button" onClick={() => onSave(draft)}>
            Зберегти
          </Button>
        </div>
      </div>
    </div>
  );
}
