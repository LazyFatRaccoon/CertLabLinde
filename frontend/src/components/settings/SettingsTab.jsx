import React, { useState, useEffect, useCallback, useContext } from "react";
import api from "../../api/axiosInstance";
import { Button } from "../ui/button";
import { Pencil, Save, Trash } from "lucide-react";
import PeriodFilterSimple from "./PeriodFilterSimple";
import { SettingsContext } from "../../context/SettingsContext";

export default function SettingsTab() {
  const { locations, setLocations, products, setProducts } =
    useContext(SettingsContext);
  const [newLocation, setNewLocation] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [editing, setEditing] = useState({});
  const [tempValues, setTempValues] = useState({});

  const fetchSettings = useCallback(async () => {
    try {
      const locRes = await api.get("/settings/locations");
      const prodRes = await api.get("/settings/products");
      setLocations(locRes.data);
      setProducts(prodRes.data);
      localStorage.setItem("locations", JSON.stringify(locRes.data));
      localStorage.setItem("products", JSON.stringify(prodRes.data));
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  }, [setLocations, setProducts]);

  useEffect(() => {
    const cachedLocations = localStorage.getItem("locations");
    const cachedProducts = localStorage.getItem("products");
    if (cachedLocations && cachedProducts) {
      setLocations(JSON.parse(cachedLocations));
      setProducts(JSON.parse(cachedProducts));
    } else {
      fetchSettings();
    }
  }, [fetchSettings, setLocations, setProducts]);

  const handleAdd = async (key, newValue) => {
    if (!newValue.trim()) return;
    const res = await api.patch(`/settings/${key}/add`, {
      itemName: newValue.trim(),
    });
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
    try {
      const res = await api.patch(`/settings/${key}/rename`, {
        id,
        newName: tempValues[localId],
      });
      if (key === "locations") {
        setLocations(res.data);
      } else {
        setProducts(res.data);
      }
      setEditing((prev) => ({ ...prev, [localId]: false }));
      localStorage.setItem(key, JSON.stringify(res.data));
    } catch (err) {
      console.error("Помилка при збереженні:", err);
    }
  };

  const handleDelete = async (key, id) => {
    const res = await api.patch(`/settings/${key}/remove`, { id });
    key === "locations" ? setLocations(res.data) : setProducts(res.data);
  };

  const handleExportAll = async (period) => {
    try {
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
      const res = await api.get("/analyses/export-all", {
        params: plainParams,
        responseType: "blob",
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
                  className="border px-2 py-1 rounded w-64 "
                />
              ) : (
                <span className="w-64 truncate border px-2 py-1 rounded ">
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
              <Button variant="outline" onClick={() => handleDelete(key, id)}>
                <Trash size={16} />
              </Button>
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
    <div className="p-4 ">
      <h2 className="text-xl font-bold mb-4">Налаштування</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Експорт усіх аналізів</h3>
        <PeriodFilterSimple onSubmit={handleExportAll} />
      </div>
      <div className="flex flex-wrap lg:flex-nowrap gap-2">
        {renderSettingList("locations", locations, newLocation, setNewLocation)}
        {renderSettingList("products", products, newProduct, setNewProduct)}
      </div>
    </div>
  );
}
