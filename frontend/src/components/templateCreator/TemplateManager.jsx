import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { normalizeField } from "@/utils/normalizeField";
import TemplateForm from "./TemplateForm";
import { useLoading } from "@/context/LoaderContext";

export default function TemplateManager({ onTemplatesUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setLoading } = useLoading();
  const selectedId = location.state?.selectedId || null;
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    if (!selectedId) {
      setDraft({ name: "", bgFile: "", fields: [] });
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/templates/${selectedId}`);
        data.fields = data.fields.map((f) => {
          if (
            ["Продукт", "Локація"].includes(f.label) &&
            f.type === "selectOnce"
          ) {
            const val = f.options?.[0];
            if (typeof val === "object") return { ...f, options: [val.id] };
          }
          return f;
        });
        setDraft(data);
      } catch (err) {
        console.error("Помилка завантаження шаблону:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedId, setLoading]);

  const handleSave = async (draft) => {
    if (!draft.name.trim()) {
      toast.error("Назва обов'язкова");
      return;
    }
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (id) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-[var(--color-bg2)]">
      {draft ? (
        <TemplateForm
          draft={draft}
          setDraft={setDraft}
          onSave={handleSave}
          onDelete={deleteTemplate}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--color-text2)]">
          Оберіть шаблон або створіть новий у боковому меню.
        </div>
      )}
    </div>
  );
}
