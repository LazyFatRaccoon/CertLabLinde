import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export default function OptionEditorModal({ options, onClose, onSave }) {
  const [localOptions, setLocalOptions] = useState([...options]);
  const [newOption, setNewOption] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  // const addOption = () => {
  //   const trimmed = newOption.trim();
  //   if (trimmed && !localOptions.includes(trimmed)) {
  //     setLocalOptions([...localOptions, trimmed]);
  //     setNewOption("");
  //   }
  // };
  const addOption = () => {
    const trimmed = newOption.trim();
    const isDuplicate = localOptions
      .map((opt) => opt.trim())
      .some((opt) => opt.toLowerCase() === trimmed.toLowerCase());

    if (trimmed && !isDuplicate) {
      setLocalOptions([...localOptions, trimmed]);
      setNewOption("");
    }
  };

  const removeOption = (opt) => {
    setLocalOptions(localOptions.filter((o) => o !== opt));
  };

  const startEdit = (index, value) => {
    setEditingIndex(index);
    setEditingValue(value);
  };

  const saveEdit = () => {
    const trimmed = editingValue.trim();
    if (!trimmed || localOptions.includes(trimmed)) return;

    const updated = [...localOptions];
    updated[editingIndex] = trimmed;
    setLocalOptions(updated);
    setEditingIndex(null);
    setEditingValue("");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4">Редагування варіантів</h2>

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {localOptions.map((opt, idx) => (
            <div
              key={opt + idx}
              className="flex items-center justify-between border rounded px-3 py-1"
            >
              {editingIndex === idx ? (
                <div className="flex items-center gap-2 flex-grow">
                  <Input
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    className="flex-grow"
                  />
                  <Button size="sm" onClick={saveEdit}>
                    ✅
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-grow">{opt}</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(idx, opt)}
                    >
                      ✏️
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeOption(opt)}
                    >
                      ✕
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Input
            placeholder="Новий варіант"
            value={newOption}
            onChange={(e) => setNewOption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addOption();
            }}
          />
          <Button onClick={addOption}>Додати</Button>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Скасувати
          </Button>
          <Button onClick={() => onSave(localOptions)}>Зберегти</Button>
        </div>
      </div>
    </div>
  );
}
