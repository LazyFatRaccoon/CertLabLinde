import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
//import { Button } from "../ui/button";
import TemplateList from "./TemplateList";
import TemplateForm from "./TemplateForm";
import { api } from "../../api/axiosInstance";
import { toast } from "react-toastify";
import { normalizeField } from "@/utils/normalizeField";

export default function TemplateManager() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState(null);
  //const [selectedId, setSelectedId] = useState(null);

  /* load list once */
  useEffect(() => {
    api.get("/templates").then(({ data }) => setTemplates(data));
  }, []);

  /* load single template when activeId changes */
  useEffect(() => {
    if (!activeId) return;
    api.get(`/templates/${activeId}`).then(({ data }) => setDraft(data));
  }, [activeId]);

  /* CRUD helpers */
  const handleSave = async (draft) => {
    if (!draft.name.trim()) {
      toast.error("Назва обов'язкова");
      return;
    }

    /* формуємо FormData */
    const fd = new FormData();
    fd.append("name", draft.name);
    fd.append("fields", JSON.stringify(draft.fields.map(normalizeField)));
    if (draft.bgFileFile) fd.append("bg", draft.bgFileFile);

    /* POST vs PUT */
    try {
      if (draft.id) {
        await api.put(`/templates/${draft.id}`, fd);
      } else {
        await api.post("/templates", fd);
      }
      const { data } = await api.get("/templates");
      setTemplates(data);
      toast.success("Шаблон збережено");

      // повертаємось у початковий стан
      setActiveId(null);
      setDraft(null);
      navigate("/template"); // або navigate("/templates")
    } catch (e) {
      toast.error("Помилка збереження");
      console.error(e);
    }
  };

  const deleteTemplate = async (id) => {
    await api.delete(`/templates/${id}`);

    setTemplates((l) => l.filter((t) => t.id !== id));
    setActiveId(null);
    setDraft(null);
  };

  /* UI */
  return (
    <div className="flex h-full">
      <TemplateList
        templates={templates}
        activeId={activeId}
        onSelect={setActiveId}
        onCreateNew={() =>
          setDraft({
            /* «+ Новий шаблон» */ name: "",
            bgFile: "",
            fields: [],
          })
        }
      />
      {draft ? (
        <TemplateForm
          draft={draft}
          setDraft={setDraft}
          onSave={handleSave}
          onDelete={deleteTemplate}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center"></div>
      )}
    </div>
  );
}
