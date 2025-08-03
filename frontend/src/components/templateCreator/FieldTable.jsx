import { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Select, SelectItem } from "../ui/select";
import { fonts } from "../../constants";
import OptionEditorModal from "./OptionEditorModal";

const defaultFont = fonts[0];

export default function FieldTable({ fields, onChange, onSetActive }) {
  const [editingOptionsId, setEditingOptionsId] = useState(null);
  const products = JSON.parse(localStorage.getItem("products")) || [];
  const locations = JSON.parse(localStorage.getItem("locations")) || [];

  const getNameById = (list, id) => list.find((i) => i.id === id)?.name || "";
  const getIdByName = (list, name) =>
    list.find((i) => i.name === name)?.id || "";

  const withDefaults = (f) => ({
    id: f.id ?? crypto.randomUUID(),
    label: "",
    type: "text",
    x: 0,
    y: 0,
    size: 100,
    fontSize: 16,
    font: defaultFont,
    color: "#000000",
    bold: false,
    italic: false,
    underline: false,
    demo: "",
    render: true,
    fixed: false,
    imageUrl: "",
    options: [],
    ...f,
  });

  const update = (id, patch) =>
    onChange(
      fields.map((f) => (f.id === id ? withDefaults({ ...f, ...patch }) : f))
    );

  const toggle = (id, key) =>
    update(id, { [key]: !fields.find((f) => f.id === id)[key] });

  return (
    <>
      <div className="overflow-auto border rounded">
        <table className="w-full text-sm border rounded">
          <thead className="  bg-[var(--color-bg)] text-[var(--color-text)] sticky top-0 ">
            <tr className="text-center ">
              <th className=" border border-[var(--color-tableBorder)]  py-2 w-6">
                #
              </th>
              <th className=" border border-[var(--color-tableBorder)] ">
                Назва
              </th>
              <th className=" border border-[var(--color-tableBorder)] ">
                Тип
              </th>
              <th className=" border border-[var(--color-tableBorder)] "></th>
              <th className=" border border-[var(--color-tableBorder)]  w-24">
                X
              </th>
              <th className="  border border-[var(--color-tableBorder)] w-24">
                Y
              </th>
              <th className=" border border-[var(--color-tableBorder)] w-20">
                Sz
              </th>
              <th className=" border border-[var(--color-tableBorder)]  w-12">
                Color
              </th>
              <th className=" border border-[var(--color-tableBorder)] w-30">
                Font
              </th>
              <th className=" border border-[var(--color-tableBorder)] w-24">
                B / I / U
              </th>
              <th className=" border border-[var(--color-tableBorder)] ">
                demo
              </th>
              <th className=" border border-[var(--color-tableBorder)] w-20">
                відобр.
              </th>
              <th className=" border border-[var(--color-tableBorder)]  w-6" />
            </tr>
          </thead>
          <tbody>
            {fields.map((f, visIdx) => {
              const fixed = f.fixed;
              const sizeVal =
                f.type === "img" ? f.size ?? 100 : f.fontSize ?? 16;

              return (
                <tr key={f.id} className="text-center align-middle">
                  <td className="border px-1 font-mono">
                    {fixed ? "" : visIdx + 1}
                  </td>
                  <td className="border px-1">
                    {fixed ? (
                      f.label
                    ) : (
                      <label htmlFor={`label-${f.id}`}>
                        <Input
                          id={`label-${f.id}`}
                          value={f.label}
                          onChange={(e) =>
                            update(f.id, { label: e.target.value })
                          }
                        />
                      </label>
                    )}
                  </td>
                  <td className="border px-1">
                    {fixed ? (
                      f.type
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <select
                          id={`type-${f.id}`}
                          value={f.type}
                          onChange={(e) =>
                            update(f.id, { type: e.target.value })
                          }
                          className="p-2 bg-[var(--color-bg2)] text-[var(--color-text2)] "
                        >
                          <option value="text">text</option>
                          <option value="select">select</option>
                          <option value="selectOnce">selectOnce</option>
                          <option value="calc">calc</option>
                          <option value="img">img</option>
                        </select>
                        {f.type === "select" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingOptionsId(f.id)}
                          >
                            📝
                          </Button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="border px-1">
                    {f.type === "selectOnce" ? null : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSetActive(f.id)}
                      >
                        Коорд.
                      </Button>
                    )}
                  </td>
                  <td className="border px-1">
                    {f.type === "selectOnce" ? null : (
                      <Input
                        className="w-24 mx-auto border-none"
                        type="number"
                        step="0.001"
                        value={Number.isFinite(f.x) ? f.x : ""}
                        onChange={(e) => update(f.id, { x: +e.target.value })}
                      />
                    )}
                  </td>
                  <td className="border px-1">
                    {f.type === "selectOnce" ? null : (
                      <Input
                        className="w-16 mx-auto border-none"
                        type="number"
                        step="0.001"
                        value={Number.isFinite(f.y) ? f.y : ""}
                        onChange={(e) => update(f.id, { y: +e.target.value })}
                      />
                    )}
                  </td>
                  <td className="border px-1">
                    {f.type === "selectOnce" ? null : (
                      <Input
                        className="w-14 mx-auto border-none"
                        type="number"
                        value={sizeVal}
                        onChange={(e) =>
                          update(
                            f.id,
                            f.type === "img"
                              ? { size: +e.target.value }
                              : { fontSize: +e.target.value }
                          )
                        }
                      />
                    )}
                  </td>
                  <td className="border px-1">
                    {f.type === "img" || f.type === "selectOnce" ? null : (
                      <input
                        type="color"
                        value={f.color || "#000000"}
                        onChange={(e) =>
                          update(f.id, { color: e.target.value })
                        }
                      />
                    )}
                  </td>
                  <td className="border px-1">
                    {f.type === "img" || f.type === "selectOnce" ? null : (
                      <Select
                        autoComplete="off"
                        value={f.font || fonts[0]}
                        onChange={(e) => update(f.id, { font: e.target.value })}
                        className="bg-[var(--color-bg)] text-[var(--color-text)] w-20 border border-[var(--color-secondary)] border-none"
                      >
                        {fonts.map((fn) => (
                          <option key={fn}>{fn}</option>
                        ))}
                      </Select>
                    )}
                  </td>
                  <td className="border space-x-1">
                    {f.type === "img" || f.type === "selectOnce" ? null : (
                      <>
                        <Button
                          size="icon"
                          variant={f.bold ? "default" : "outline"}
                          onClick={() => toggle(f.id, "bold")}
                        >
                          B
                        </Button>
                        <Button
                          size="icon"
                          variant={f.italic ? "default" : "outline"}
                          onClick={() => toggle(f.id, "italic")}
                        >
                          I
                        </Button>
                        <Button
                          size="icon"
                          variant={f.underline ? "default" : "outline"}
                          onClick={() => toggle(f.id, "underline")}
                        >
                          U
                        </Button>
                      </>
                    )}
                  </td>
                  <td className="border px-1">
                    {f.type === "img" ? null : f.type === "select" ? (
                      <Select
                        value={f.demo || f.options?.[0] || ""}
                        onValueChange={(val) => update(f.id, { demo: val })}
                        className="border-none"
                      >
                        {(f.options || []).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </Select>
                    ) : f.type === "selectOnce" && f.label === "Продукт" ? (
                      <Select
                        value={getNameById(products, f.options?.[0]) || ""}
                        onValueChange={(val) => {
                          update(f.id, {
                            ...f,
                            options: [getIdByName(products, val)],
                          });
                        }}
                        className="border-none"
                      >
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </Select>
                    ) : f.type === "selectOnce" && f.label === "Локація" ? (
                      <Select
                        value={getNameById(locations, f.options?.[0]) || ""}
                        onValueChange={(val) => {
                          update(f.id, {
                            ...f,
                            options: [getIdByName(locations, val)],
                          });
                        }}
                        className="border-none"
                      >
                        {locations.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </Select>
                    ) : (
                      <Input
                        autoComplete="off"
                        value={f.demo || ""}
                        onChange={(e) => update(f.id, { demo: e.target.value })}
                        className="border-none"
                      />
                    )}
                  </td>
                  <td className="border px-1">
                    <input
                      type="checkbox"
                      checked={f.render !== false}
                      onChange={(e) =>
                        update(f.id, { render: e.target.checked })
                      }
                    />
                  </td>
                  <td className="border px-1">
                    {!fixed && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          onChange(fields.filter((x) => x.id !== f.id))
                        }
                      >
                        ✕
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editingOptionsId && (
        <OptionEditorModal
          options={fields.find((f) => f.id === editingOptionsId)?.options || []}
          onClose={() => setEditingOptionsId(null)}
          onSave={(opts) => {
            // update(editingOptionsId, { options: opts });
            const f = fields.find((f) => f.id === editingOptionsId);

            // Оновлюємо options і demo разом:
            const newField = {
              ...f,
              options: opts,
            };

            if (
              newField.demo === "" ||
              (Array.isArray(opts) && !opts.includes(newField.demo))
            ) {
              newField.demo = opts?.[0] ?? "";
            }

            update(f.id, { options: opts, demo: newField.demo });
            setEditingOptionsId(null);
          }}
        />
      )}
    </>
  );
}
