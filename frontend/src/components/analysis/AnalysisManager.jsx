import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/api/axiosInstance";
//import AnalysisList from "./AnalysisList";
import AnalysisTable from "./AnalysisTable";
import { toast } from "react-toastify";

//import axios from "axios";
// <AnalysisList
//     list={templates}
//   activeId={selectedId}
// onSelect={handleSelect}
// />
export default function AnalysisManager() {
  /* ─────────── helpers ─────────────────────────────────────────── */
  const todayUi = () => new Date().toLocaleDateString("uk-UA");
  const plusOneUi = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString("uk-UA");
  };

  /* ─────────── state ───────────────────────────────────────────── */
  //const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tpl, setTpl] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [periodParams, setPeriodParams] = useState(() => {
    try {
      const raw = localStorage.getItem("analysisPeriodParams");
      const parsed = raw ? JSON.parse(raw) : {};
      const corrected = {
        period: parsed.period || "week",
        from: parsed.from || todayUi(),
        to: parsed.to || plusOneUi(),
      };
      localStorage.setItem("analysisPeriodParams", JSON.stringify(corrected));
      return corrected;
    } catch {
      const fallback = { period: "week", from: todayUi(), to: plusOneUi() };
      localStorage.setItem("analysisPeriodParams", JSON.stringify(fallback));
      return fallback;
    }
  });

  const location = useLocation();
  const currentIdRef = useRef(null);

  /* ─────────── effects: sync selectedId from sidebar ──────────── */
  useEffect(() => {
    const incoming = location.state?.selectedId;
    if (incoming && incoming !== selectedId) {
      setSelectedId(incoming);
    }
  }, [location, selectedId]);

  /* ─────────── effects: persist params & selectedId ───────────── */
  useEffect(() => {
    localStorage.setItem("analysisPeriodParams", JSON.stringify(periodParams));
  }, [periodParams]);

  useEffect(() => {
    if (selectedId) localStorage.setItem("selectedTemplateId", selectedId);
  }, [selectedId]);

  /* ─────────── api helpers ─────────────────────────────────────── */
  const fetchTplAndRows = useCallback(async (id, params) => {
    if (!id) return;
    currentIdRef.current = id;
    setLoading(true);
    try {
      const [{ data: fullTpl }, { data: list }] = await Promise.all([
        api.get(`/templates/${id}`),
        api.get("/analyses", {
          params:
            typeof params === "string"
              ? { tpl: id, period: params }
              : { tpl: id, ...params },
        }),
      ]);
      setTpl(fullTpl);
      setRows(list);
    } catch {
      toast.error("Помилка завантаження даних");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─────────── first load: templates ───────────────────────────── */
  useEffect(() => {
    api
      .get("/templates")
      .then(({ data }) => {
        // setTemplates(data);
        const savedId = localStorage.getItem("selectedTemplateId");
        const fallbackId = data[0]?.id;
        const idToUse = data.find((t) => t.id === savedId)?.id || fallbackId;
        if (idToUse) {
          setSelectedId(idToUse);
          fetchTplAndRows(idToUse, periodParams);
        }
      })
      .catch(() => toast.error("Не вдалося завантажити шаблони"));
  }, [fetchTplAndRows, periodParams]);

  /* ─────────── reload on id/period change ─────────────────────── */
  useEffect(() => {
    if (selectedId) fetchTplAndRows(selectedId, periodParams);
  }, [selectedId, periodParams, fetchTplAndRows]);

  /* ─────────── list handler ───────────────────────────────────── */
  // const handleSelect = (id) => {
  //   if (id !== selectedId) setSelectedId(id);
  // };

  /* ─────────── render ─────────────────────────────────────────── */
  return (
    <div className="flex h-full">
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Завантаження…
        </div>
      ) : tpl ? (
        <AnalysisTable
          tpl={tpl}
          rows={rows}
          setRows={setRows}
          setPeriodParams={setPeriodParams}
          periodParams={periodParams}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Виберіть шаблон →
        </div>
      )}
    </div>
  );
}
