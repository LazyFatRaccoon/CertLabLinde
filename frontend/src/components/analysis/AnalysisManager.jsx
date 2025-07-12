import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/api/axiosInstance";
import AnalysisList from "./AnalysisList";
import AnalysisTable from "./AnalysisTable";
import { toast } from "react-toastify";

export default function AnalysisManager() {
  const [templates, setTemplates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tpl, setTpl] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // ① ref-контейнер для “поточного” id
  const currentIdRef = useRef(null);

  const fetchTplAndRows = useCallback(async (id) => {
    if (!id) return;
    currentIdRef.current = id; // ② зафіксували, що саме зараз очікуємо
    setLoading(true);

    try {
      console.log("ref#2", currentIdRef.current);
      const [{ data: fullTpl }, { data: list }] = await Promise.all([
        api.get(`/templates/${currentIdRef.current}`),
        api.get("/analyses", { params: { tpl: currentIdRef.current } }),
      ]);
      console.log("ref#3", currentIdRef.current);
      // ③ Повернулась відповідь – упевніться, що це все ще актуальний запит
      // if (currentIdRef.current !== id) {
      //   console.log("differen id and current");
      //   return;
      // }
      console.log("template", fullTpl);
      console.log("analyses", list);
      setTpl(fullTpl);
      setRows(list);
    } catch {
      toast.error("Помилка завантаження даних");
    } finally {
      // той самий захист – аби не зняти loader, якщо вже пішов новий запит
      //console.log("currentIdRef.current", currentIdRef.current);
      //console.log("id", id);
      setLoading(false);
    }
  }, []);

  /* початкове завантаження списку схем */
  useEffect(() => {
    api
      .get("/templates")
      .then(({ data }) => {
        setTemplates(data);
        if (data.length) {
          setSelectedId(data[0].id);
          fetchTplAndRows(data[0].id);
        }
      })
      .catch(() => toast.error("Не вдалося завантажити шаблони"));
  }, [fetchTplAndRows]);

  const handleSelect = (id) => {
    if (id === selectedId) return; // вже активний
    fetchTplAndRows(id);
    setSelectedId(id);
  };
  return (
    <div className="flex h-full">
      <AnalysisList
        list={templates}
        activeId={selectedId}
        onSelect={handleSelect}
      />

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Завантаження…
        </div>
      ) : tpl ? (
        <AnalysisTable tpl={tpl} rows={rows} setRows={setRows} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Виберіть шаблон →
        </div>
      )}
    </div>
  );
}
