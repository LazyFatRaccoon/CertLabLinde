// src/pages/CertificateRequest.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/api/axiosInstance";
import { tokenStore } from "@/api/tokenStore";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DatePicker from "@/components/ui/datepicker"; // будь-який date-picker

const PRODUCTS = [
  "Оксиген медичний",
  "Азот",
  "Аргон",
  "Гелій",
  "Вуглекислий газ",
];
const todayUi = () =>
  new Date().toLocaleDateString("uk-UA").replace(/\//g, ".");

export default function CertificateRequest() {
  const [form, setForm] = useState({
    product: PRODUCTS[0],
    date: todayUi(), // DD.MM.YYYY
    batch: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.batch.trim()) return toast.error("Вкажіть партію");
    setLoading(true);
    try {
      // 🔗  запросити PDF
      const { data } = await api.post(
        "/public/certificates", // ← публічний “no-auth” енд-поїнт
        form,
        { responseType: "blob" } // отримуємо файл
      );
      // 💾  створити посилання для скачування
      const url = URL.createObjectURL(
        new Blob([data], { type: "application/pdf" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${form.batch}.pdf`;
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
          <label>Продукт</label>
          <select
            className="w-full border p-2 rounded"
            value={form.product}
            onChange={(e) => setForm({ ...form, product: e.target.value })}
          >
            {PRODUCTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Дата</label>
          <DatePicker
            value={form.date}
            onChange={(d) => setForm({ ...form, date: d })}
          />
        </div>

        <div>
          <label>Партія</label>
          <Input
            value={form.batch}
            onChange={(e) => setForm({ ...form, batch: e.target.value })}
          />
        </div>

        <Button disabled={loading}>
          {loading ? "Пошук…" : "Запросити сертифікат"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="absolute left-4 top-4"
          onClick={() =>
            tokenStore.get() ? navigate("/") : navigate("/login")
          }
        >
          Назад до {tokenStore.get() ? "програми" : "входу"}
        </Button>
      </form>
    </div>
  );
}
