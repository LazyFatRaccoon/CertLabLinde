import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "../ui/button";
import { Pencil, Save } from "lucide-react";
import PeriodFilterSimple from "./PeriodFilterSimple";

export default function SettingsTab() {
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [newLocation, setNewLocation] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [editing, setEditing] = useState({});
  const [tempValues, setTempValues] = useState({});

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token");
      const locRes = await axios.get("/api/settings/locations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const prodRes = await axios.get("/api/settings/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations(locRes.data);
      setProducts(prodRes.data);
      localStorage.setItem("locations", JSON.stringify(locRes.data));
      localStorage.setItem("products", JSON.stringify(prodRes.data));
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  useEffect(() => {
    const cachedLocations = localStorage.getItem("locations");
    const cachedProducts = localStorage.getItem("products");
    if (cachedLocations && cachedProducts) {
      setLocations(JSON.parse(cachedLocations));
      setProducts(JSON.parse(cachedProducts));
    } else {
      fetchSettings();
    }
  }, []);

  const handleAdd = async (key, newValue) => {
    if (!newValue.trim()) return;
    const token = localStorage.getItem("token");
    const res = await axios.patch(
      `/api/settings/${key}/add`,
      { itemName: newValue.trim() },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    key === "locations" ? setLocations(res.data) : setProducts(res.data);
    key === "locations" ? setNewLocation("") : setNewProduct("");
  };

  const handleEditToggle = (key, id, name) => {
    const localId = `${key}-${id}`;
    setEditing((prev) => ({ ...prev, [localId]: !prev[localId] }));
    setTempValues((prev) => ({ ...prev, [localId]: name }));
  };

  const handleSave = async (key, id) => {
    const localId = `${key}-${id}`;
    const token = localStorage.getItem("token");
    const res = await axios.patch(
      `/api/settings/${key}/rename`,
      { id, newName: tempValues[localId] },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    key === "locations" ? setLocations(res.data) : setProducts(res.data);
    setEditing((prev) => ({ ...prev, [localId]: false }));
  };

  const handleDelete = async (key, id) => {
    const token = localStorage.getItem("token");
    const res = await axios.patch(
      `/api/settings/${key}/remove`,
      { id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    key === "locations" ? setLocations(res.data) : setProducts(res.data);
  };

  const handleExportAll = async (period) => {
    try {
      const token = localStorage.getItem("token");
      const plainParams = {
        ...period,
        from:
          period.from instanceof Date
            ? period.from.toISOString().split("T")[0]
            : period.from,
        to:
          period.to instanceof Date
            ? period.to.toISOString().split("T")[0]
            : period.to,
      };
      const res = await axios.get("/api/analyses/export-all", {
        params: plainParams,
        responseType: "blob",
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `усі_аналізи_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Не вдалося експортувати дані.");
    }
  };

  const renderSettingList = (key, data, newValue, setNewValue) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold">
        {key === "locations" ? "Локації" : "Продукти"}
      </h3>
      <ul className="mb-2">
        {data.map(({ id, name }) => {
          const localId = `${key}-${id}`;
          return (
            <li key={localId} className="flex gap-2 items-center my-1">
              {editing[localId] ? (
                <input
                  value={tempValues[localId] || ""}
                  onChange={(e) =>
                    setTempValues((prev) => ({
                      ...prev,
                      [localId]: e.target.value,
                    }))
                  }
                  className="border px-2 py-1 rounded w-64"
                />
              ) : (
                <span className="w-64 truncate border px-2 py-1 rounded">
                  {name}
                </span>
              )}
              <Button
                variant="outline"
                onClick={() => handleEditToggle(key, id, name)}
              >
                <Pencil size={16} />
              </Button>
              <Button
                variant="outline"
                disabled={!editing[localId]}
                onClick={() => handleSave(key, id)}
              >
                <Save size={16} />
              </Button>
              <Button onClick={() => handleDelete(key, id)}>Видалити</Button>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2 items-center">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={key === "locations" ? "Нова локація" : "Новий продукт"}
          className="border px-2 py-1 rounded w-64"
        />
        <Button onClick={() => handleAdd(key, newValue)}>Додати</Button>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Налаштування</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Експорт усіх аналізів</h3>
        <PeriodFilterSimple onSubmit={handleExportAll} />
      </div>
      {renderSettingList("locations", locations, newLocation, setNewLocation)}
      {renderSettingList("products", products, newProduct, setNewProduct)}
    </div>
  );
}
