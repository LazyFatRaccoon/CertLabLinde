import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { API_URL, PUBLIC_URL } from "../../constants";

export default function TemplateCreator() {
  const [templateName, setTemplateName] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [stampCoords, setStampCoords] = useState("");
  const [fields, setFields] = useState([
    {
      id: uuidv4(),
      name: "Аналіз провів",
      type: "calc",
      coords: "",
      testValue: "",
      fontSize: "16",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      color: "#000000",
    },
  ]);
  const [selectingField, setSelectingField] = useState(null);
  const [selectingStamp, setSelectingStamp] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (["image/jpeg", "image/png"].includes(file.type)) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/templates/upload-template`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setImagePreview(`${PUBLIC_URL}${data.imageUrl}`);
      setImageFile(
        new File([file], data.imageUrl.split("/").pop(), { type: file.type })
      );
    } else {
      alert("Підтримуються лише JPG, PNG або PDF");
    }
  };

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: uuidv4(),
        name: "",
        type: "text",
        coords: "",
        testValue: "",
        fontSize: "16",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        color: "#000000",
      },
    ]);
  };

  const updateField = (id, key, value) => {
    setFields((prev) =>
      prev.map((field) =>
        field.id === id ? { ...field, [key]: value } : field
      )
    );
  };

  const handleImageClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width).toFixed(4);
    const y = ((e.clientY - rect.top) / rect.height).toFixed(4);
    if (selectingField) {
      updateField(selectingField, "coords", `${x},${y}`);
      setSelectingField(null);
    } else if (selectingStamp) {
      setStampCoords(`${x},${y}`);
      setSelectingStamp(false);
    }
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("templateName", templateName);
    formData.append("fields", JSON.stringify(fields));

    await fetch(`${API_URL}/templates`, {
      method: "POST",
      body: formData,
    });
    alert("Шаблон збережено!");
  };

  const renderTestFields = () => {
    return fields.map((field) => {
      const [x, y] = field.coords.split(",").map(Number);
      if (!x || !y) return null;
      return (
        <div
          key={field.id}
          className="absolute"
          style={{
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            transform: "translate(0%, -100%)",
            fontSize: `${field.fontSize}px`,
            fontWeight: field.fontWeight,
            fontStyle: field.fontStyle,
            textDecoration: field.textDecoration,
            color: field.color,
            whiteSpace: "nowrap",
          }}
        >
          {field.testValue}
        </div>
      );
    });
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Створити шаблон</h2>
      <label htmlFor="templateName">
        <input
          id="templateName"
          name="templateName"
          autoComplete="off"
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Назва шаблону"
          className="border p-2 rounded w-full"
        />
      </label>
      <input
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={handleImageUpload}
      />

      {fields.map((field) => (
        <div key={field.id} className="border p-2 rounded space-y-2">
          <input
            type="text"
            value={field.name}
            onChange={(e) => updateField(field.id, "name", e.target.value)}
            placeholder="Назва поля"
            className="border p-1 rounded w-full"
          />
          <select
            value={field.type}
            onChange={(e) => updateField(field.id, "type", e.target.value)}
            className="border p-1 rounded w-full"
          >
            <option value="text">Текст</option>
            <option value="list">Список</option>
            <option value="calc">Обчислювальне</option>
          </select>
          <div className="flex gap-2 flex-wrap">
            <input
              type="number"
              min="8"
              value={field.fontSize}
              onChange={(e) =>
                updateField(field.id, "fontSize", e.target.value)
              }
              placeholder="Розмір"
              className="border p-1 rounded w-20"
            />
            <select
              value={field.fontWeight}
              onChange={(e) =>
                updateField(field.id, "fontWeight", e.target.value)
              }
              className="border p-1 rounded"
            >
              <option value="normal">Звичайний</option>
              <option value="bold">Жирний</option>
            </select>
            <select
              value={field.fontStyle}
              onChange={(e) =>
                updateField(field.id, "fontStyle", e.target.value)
              }
              className="border p-1 rounded"
            >
              <option value="normal">Звичайний</option>
              <option value="italic">Курсив</option>
            </select>
            <select
              value={field.textDecoration}
              onChange={(e) =>
                updateField(field.id, "textDecoration", e.target.value)
              }
              className="border p-1 rounded"
            >
              <option value="none">Без підкреслення</option>
              <option value="underline">Підкреслений</option>
            </select>
            <input
              type="color"
              value={field.color}
              onChange={(e) => updateField(field.id, "color", e.target.value)}
              className="w-10 h-10 p-1 border rounded"
            />
          </div>
          <button
            onClick={() => setSelectingField(field.id)}
            className="bg-blue-600 text-white px-2 py-1 rounded"
          >
            Вказати координати
          </button>
          <input
            type="text"
            value={field.coords}
            onChange={(e) => updateField(field.id, "coords", e.target.value)}
            placeholder="x,y"
            className="border p-1 rounded w-full"
          />
          <input
            type="text"
            value={field.testValue}
            onChange={(e) => updateField(field.id, "testValue", e.target.value)}
            placeholder="Тестове значення"
            className="border p-1 rounded w-full"
          />
        </div>
      ))}

      <button
        onClick={addField}
        className="bg-gray-500 text-white px-4 py-2 rounded"
      >
        Додати поле
      </button>

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Створити шаблон
      </button>

      <div className="mt-6 border-t pt-4">
        <h3 className="text-xl font-semibold">Печатка</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectingStamp(true)}
            className="bg-blue-600 text-white px-2 py-1 rounded"
          >
            Вказати координати
          </button>
          <input
            type="text"
            value={stampCoords}
            onChange={(e) => setStampCoords(e.target.value)}
            placeholder="x,y"
            className="border p-1 rounded"
          />
          <button
            onClick={() => setStampCoords("")}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Видалити
          </button>
        </div>
      </div>
      {imagePreview && (
        <div
          className="relative mt-4 border inline-block"
          onClick={handleImageClick}
        >
          <img
            src={imagePreview}
            alt="Попередній перегляд"
            className="max-w-full"
          />
          {renderTestFields()}
          {stampCoords && (
            <img
              src={`${PUBLIC_URL}/stamp.png`}
              alt="Печатка"
              className="absolute"
              style={{
                left: `${parseFloat(stampCoords.split(",")[0]) * 100}%`,
                top: `${parseFloat(stampCoords.split(",")[1]) * 100}%`,
                transform: "translate(0%, -100%)",
                width: "100px",
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
