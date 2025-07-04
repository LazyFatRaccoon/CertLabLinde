// components/analysis/AnalysisManager.jsx
import { useState, useEffect, useCallback } from "react";
import { api } from "@/api/axiosInstance";
import AnalysisList from "./AnalysisList";
import AnalysisTable from "./AnalysisTable";
import { toast } from "react-toastify";

export default function AnalysisManager() {
  /* ---------- state ---------- */
  const [templates, setTemplates] = useState([]); // список {id,name}
  const [selectedId, setSelectedId] = useState(null); // id, який обрали ліворуч
  const [tpl, setTpl] = useState(null); // повний Template з fields
  const [rows, setRows] = useState([]); // Analyses цього шаблону

  /* ---------- 1. отримуємо всі шаблони один раз ---------- */
  useEffect(() => {
    api
      .get("/templates")
      .then(({ data }) => setTemplates(data))
      .catch(() => toast.error("Не вдалося завантажити шаблони"));
  }, []);

  /* ---------- 2. коли обрали id → грузимо повний tpl + analyses ---------- */
  const loadTplAndRows = useCallback(async (id) => {
    if (!id) {
      setTpl(null);
      setRows([]);
      return;
    }

    try {
      const [{ data: fullTpl }, { data: list }] = await Promise.all([
        api.get(`/templates/${id}`), // повний шаблон
        api.get("/analyses", { params: { tpl: id } }), // список аналізів (може [])
      ]);

      setTpl(fullTpl);
      setRows(list);
    } catch {
      toast.error("Помилка завантаження даних");
    }
  }, []);

  /* реагуємо на зміну selectedId */
  useEffect(() => {
    loadTplAndRows(selectedId);
  }, [selectedId, loadTplAndRows]);

  /* ---------- UI ---------- */
  return (
    <div className="flex h-full">
      <AnalysisList
        list={templates}
        activeId={selectedId}
        onSelect={setSelectedId}
      />

      {tpl ? (
        <AnalysisTable tpl={tpl} rows={rows} setRows={setRows} />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p>Виберіть шаблон&nbsp;→</p>
        </div>
      )}
    </div>
  );
}
