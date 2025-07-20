import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { normalizeField } from "@/utils/normalizeField";
import TemplateForm from "./TemplateForm";

export default function TemplateManager({ onTemplatesUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedId = location.state?.selectedId || null;
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!selectedId) {
      setDraft({ name: "", bgFile: "", fields: [] });
      return;
    }

    api.get(`/templates/${selectedId}`).then(({ data }) => setDraft(data));
  }, [selectedId]);

  const handleSave = async (draft) => {
    if (!draft.name.trim()) {
      toast.error("Назва обов'язкова");
      return;
    }

    const fd = new FormData();
    fd.append("name", draft.name);
    fd.append("fields", JSON.stringify(draft.fields.map(normalizeField)));
    if (draft.bgFileFile) fd.append("bg", draft.bgFileFile);

    try {
      if (draft.id) {
        await api.put(`/templates/${draft.id}`, fd);
      } else {
        const res = await api.post("/templates", fd);
        draft.id = res.data.id;
      }

      // 🔄 Отримати оновлений список шаблонів і оновити пропс
      const updated = await api.get("/templates");
      if (onTemplatesUpdate) onTemplatesUpdate(updated.data);

      toast.success("Шаблон збережено");
      navigate("/template", { state: { selectedId: draft.id || null } });
    } catch (e) {
      toast.error(e.response?.data?.message || "Помилка збереження");
      console.error("handleSave →", e);
    }
  };

  const deleteTemplate = async (id) => {
    try {
      await api.delete(`/templates/${id}`);
      toast.success("Шаблон видалено");
      setDraft(null);

      const updated = await api.get("/templates");
      if (onTemplatesUpdate) onTemplatesUpdate(updated.data);

      navigate("/template", { state: {} });
    } catch (e) {
      toast.error("Помилка видалення");
      console.error(e);
    }
  };

  return (
    <div className="flex h-full">
      {draft ? (
        <TemplateForm
          draft={draft}
          setDraft={setDraft}
          onSave={handleSave}
          onDelete={deleteTemplate}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          Оберіть шаблон або створіть новий у боковому меню.
        </div>
      )}
    </div>
  );
}
