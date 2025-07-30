import { useState, useEffect } from "react";
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
  const { setLoading } = useLoading();
  const [loading2, setLoading2] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = !!tokenStore.get();

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
        setTemplates(unique);

        if (unique.length) {
          setForm((prev) => ({ ...prev, templateName: unique[0] }));
        }
        console.log("1");
      } catch (err) {
        toast.error("Не вдалося завантажити шаблони");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [setLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.batch.trim()) return toast.error("Вкажіть партію");
    setLoading(true);
    setLoading2(true);
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
            <label htmlFor="template">Назва газу або рідини</label>
            <select
              id="template"
              name="template"
              className="w-full border p-2 rounded bg-[var(--color-bg2)] text-[var(--color-text2)] hover:border-[var(--color-primary)] transition-colors"
              value={form.templateName}
              onChange={(e) =>
                setForm({ ...form, templateName: e.target.value })
              }
            >
              {templates.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
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
            <label htmlFor="batchNumber">№ Партії або номер продукції</label>
            <input
              id="batchNumber"
              name="batchNumber"
              className="w-full rounded border p-2 focus:border-[var(--color-primary)] focus:outline-none bg-[var(--color-bg2)] text-[var(--color-text2)] hover:border-[var(--color-primary)] transition-colors"
              autoComplete="off"
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
            />
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
