import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/datepicker";
import { tokenStore } from "@/api/tokenStore";

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = !!tokenStore.get();

  useEffect(() => {
    const fetchTemplates = async () => {
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
        setTemplates(unique);

        if (unique.length) {
          setForm((prev) => ({ ...prev, templateName: unique[0] }));
        }
      } catch (err) {
        toast.error("Не вдалося завантажити шаблони");
      }
    };
    fetchTemplates();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.batch.trim()) return toast.error("Вкажіть партію");
    setLoading(true);
    try {
      const tpl = allTemplates.find((t) => t.name === form.templateName);
      if (!tpl) return toast.error("Шаблон не знайдено");

      const { data } = await axios.post(
        "/api/public/certificates",
        {
          templateName: tpl.name,
          date: form.date,
          batch: form.batch,
        },
        { responseType: "blob" }
      );
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
    }
  };

  return (
    <div className="max-w-md m-20 mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-2">Замовити сертифікат</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="template">Шаблон</label>
          <select
            id="template"
            name="template"
            className="w-full border p-2 rounded"
            value={form.templateName}
            onChange={(e) => setForm({ ...form, templateName: e.target.value })}
          >
            {templates.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="datepicker">Дата</label>
          <DatePicker
            id="datepicker"
            name="datepicker"
            value={form.date}
            onChange={(d) => setForm({ ...form, date: d })}
          />
        </div>

        <div>
          <label htmlFor="batchNumber">Партія</label>
          <Input
            id="batchNumber"
            name="batchNumber"
            autoComplete="off"
            value={form.batch}
            onChange={(e) => setForm({ ...form, batch: e.target.value })}
          />
        </div>

        <Button disabled={loading}>
          {loading ? "Пошук…" : "Запросити сертифікат"}
        </Button>

        {isLoggedIn && (
          <Button
            type="button"
            variant="outline"
            className="absolute left-4 top-4"
            onClick={() => navigate("/login")}
          >
            Назад до входу
          </Button>
        )}
      </form>
    </div>
  );
}
