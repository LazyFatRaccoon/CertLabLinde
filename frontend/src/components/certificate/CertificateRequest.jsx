import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/datepicker";
import { tokenStore } from "@/api/tokenStore";
import { useLoading } from "../../context/LoaderContext";

const todayUi = () =>
  new Date().toLocaleDateString("uk-UA").replace(/\//g, ".");

export default function CertificateRequest() {
  const [allTemplates, setAllTemplates] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [form, setForm] = useState({
    templateName: "",
    date: todayUi(),
    batch: "",
  });

  const [templateQuery, setTemplateQuery] = useState(form.templateName || "");

  const filteredTemplates = useMemo(() => {
    const q = templateQuery.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((name) => name.toLowerCase().startsWith(q));
  }, [templates, templateQuery]);

  const { setLoading } = useLoading();
  const [loading2, setLoading2] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = !!tokenStore.get();

  // ⬅️ NEW: зберігаємо вибране "пошукове" поле
  const [searchField, setSearchField] = useState(null);
  const defaultBatchLabel = "№ Партії або номер продукції";

  // зручно тримати швидкий доступ до вибраного шаблону
  const selectedTemplate = useMemo(
    () => allTemplates.find((t) => t.name === form.templateName) || null,
    [allTemplates, form.templateName]
  );

  // ⬅️ NEW: допоміжна ф-ція пошуку поля з search_sign
  const findSearchField = (tpl) => {
    if (!tpl?.fields) return null;
    // 1) пріоритет — search_sign === true
    const byFlag = tpl.fields.find((f) => f?.search_sign === true);
    if (byFlag) return byFlag;
    // 2) fallback — поле "Партія" (як у чинній логіці бекенду)
    const byLabel = tpl.fields.find((f) => f?.label === "Партія");
    return byLabel || null;
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/templates/public");
        setAllTemplates(data);

        const unique = [];
        const seen = new Set();
        for (const t of data) {
          if (!seen.has(t.name)) {
            unique.push(t.name);
            seen.add(t.name);
          }
        }
        unique.sort((a, b) =>
          a.localeCompare(b, "uk", { sensitivity: "base", numeric: true })
        );
        setTemplates(unique);

        if (unique.length) {
          const firstName = unique[0];
          setForm((prev) => ({ ...prev, templateName: firstName }));
          // ⬅️ NEW: відразу визначимо поле пошуку
          const tpl = data.find((t) => t.name === firstName);
          setSearchField(findSearchField(tpl));
        }
      } catch (err) {
        toast.error("Не вдалося завантажити шаблони");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [setLoading]);

  // ⬅️ NEW: реакція на зміну вибраного шаблону — оновити поле пошуку
  useEffect(() => {
    setSearchField(findSearchField(selectedTemplate));
  }, [selectedTemplate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.batch.trim()) return toast.error("Вкажіть значення для пошуку");

    setLoading(true);
    setLoading2(true);
    try {
      const tpl = selectedTemplate;
      if (!tpl) return toast.error("Шаблон не знайдено");

      // ⬅️ NEW: формуємо тіло запиту з підказкою бекенду, по якому полі шукати
      const payload = {
        templateName: tpl.name,
        date: form.date,
        batch: form.batch, // значення, яке ввів користувач
        // ↓ підкажемо бекенду, яке саме поле використати як "batch"
        searchFieldId: searchField?.id ?? null, // бек може за замовчуванням падати на "Партія", якщо null
      };

      const { data } = await axios.post("/api/public/certificates", payload, {
        responseType: "blob",
      });

      const url = URL.createObjectURL(
        new Blob([data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `Сертифікат_${form.templateName}_${
        form.batch
      }_${form.date.replaceAll(".", "")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("✅ Сертифікат згенеровано й завантажено");
    } catch (e) {
      if (e.response?.status === 404) {
        toast.info("Сертифікат не знайдено 😕");
      } else {
        const msg =
          e.response?.data?.message ?? "Помилка генерації сертифіката";
        toast.error(`❌ ${msg}`);
      }
    } finally {
      setLoading(false);
      setLoading2(false);
    }
  };

  return (
    <>
      <div className="h-20  bg-[#002d54] flex items-center px-20">
        <div className="  shadow-md">
          <img
            src="/linde-logo-desktop.avif"
            alt="Linde Logo"
            className=" h-22 mt-4 shadow-md"
          />
        </div>
      </div>

      <div className="max-w-md m-20 mx-auto p-6 space-y-4  text-[var(--color-bg)] rounded ">
        <h1 className="text-2xl font-bold mb-2">Замовити сертифікат</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="template-input">Назва газу або рідини</label>
            <input
              id="template-input"
              list="templates-list"
              className="w-full border p-2 rounded bg-[var(--color-bg2)] text-[var(--color-text2)] hover:border-[var(--color-primary)] transition-colors"
              value={templateQuery}
              onChange={(e) => {
                const name = e.target.value;
                setTemplateQuery(name);
                // одразу оновлюємо форму та очищаємо batch
                setForm((prev) => ({ ...prev, templateName: name, batch: "" }));
              }}
              placeholder="Почніть вводити назву або оберіть із списку…"
              autoComplete="off"
            />
            <datalist id="templates-list">
              {filteredTemplates.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="datepicker">Дата аналізу</label>
            <DatePicker
              id="datepicker"
              name="datepicker"
              value={form.date}
              className="border rounded pl-2 pr-14 py-2 bg-[var(--color-bg2)] text-[var(--color-text2)] cursor-pointer select-none hover:border-[var(--color-primary)] transition-colors"
              onChange={(d) => setForm({ ...form, date: d })}
            />
          </div>

          <div className="pb-4">
            {/* ⬅️ NEW: динамічний напис з поля пошуку */}
            <label htmlFor="batchNumber">
              {searchField?.label || defaultBatchLabel}
            </label>
            <input
              id="batchNumber"
              name="batchNumber"
              className="w-full rounded border p-2 focus:border-[var(--color-primary)] focus:outline-none bg-[var(--color-bg2)] text-[var(--color-text2)] hover:border-[var(--color-primary)] transition-colors"
              autoComplete="off"
              value={form.batch}
              placeholder={searchField?.placeholder || ""} // опційно
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
            />
            {/* Можна підказку показати: */}
            {searchField?.hint && (
              <div className="text-xs opacity-70 mt-1">{searchField.hint}</div>
            )}
          </div>

          <Button disabled={loading2}>
            {loading2 ? "Пошук…" : "Запит сертифікату якості"}
          </Button>

          {isLoggedIn && (
            <Button
              type="button"
              variant="outline"
              className="absolute right-4 top-24"
              onClick={() => navigate("/login")}
            >
              Назад до входу
            </Button>
          )}
        </form>
      </div>
    </>
  );
}
