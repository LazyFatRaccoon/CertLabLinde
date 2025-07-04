// src/pages/CertificateRequest.jsx
import { useState } from "react";
import { api } from "@/api/axiosInstance";
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

export default function CertificateRequest() {
  const [form, setForm] = useState({
    product: PRODUCTS[0],
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    batch: "",
  });
  const [loading, setLoading] = useState(false);

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
    } catch (e) {
      toast.error(
        e.response?.data?.message ?? "Не знайдено відповідного аналізу"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
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
      </form>
    </div>
  );
}
