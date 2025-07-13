import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { fonts } from "../../constants";

const defaultFont = fonts[0];

/**
 * Таблиця полів шаблону.
 *  - для text / select / calc у колонці **Sz** правимо `fontSize`
 *  - для img (Підпис, Печатка)   правимо `size` (ширину PNG)
 *  - за замовченням:  fontSize 16 px, font Arial, size 100 px
 */
export default function FieldTable({ fields, onChange, onSetActive }) {
  /* ───────── helpers ───────── */
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
    ...f, // існуючі значення мають пріоритет
  });

  const update = (id, patch) =>
    onChange(
      fields.map((f) => (f.id === id ? withDefaults({ ...f, ...patch }) : f))
    );

  const toggle = (id, key) =>
    update(id, { [key]: !fields.find((f) => f.id === id)[key] });

  /* фіксовані (system) поля ставимо в кінець */
  const sorted = [...fields].sort((a, b) =>
    a.fixed === b.fixed ? 0 : a.fixed ? 1 : -1
  );

  return (
    <table className="w-full text-sm border">
      <thead className="bg-gray-100">
        <tr className="text-center">
          <th className="w-6">#</th>
          <th>Назва</th>
          <th>Тип</th>
          <th></th>
          <th className="w-16">X</th>
          <th className="w-16">Y</th>
          <th className="w-14">Sz</th>
          <th className="w-12">🎨</th>
          <th>Font</th>
          <th className="w-24">B / I / U</th>
          <th>Текст / demo</th>
          <th className="w-20">відобр.</th>
          <th className="w-6" />
        </tr>
      </thead>
      <tbody>
        {sorted.map((f, visIdx) => {
          const fixed = f.fixed;
          /* поточне значення для колонки Sz */
          const sizeVal = f.type === "img" ? f.size ?? 100 : f.fontSize ?? 16;

          return (
            <tr key={f.id} className="text-center align-middle">
              <td className="border px-1 font-mono">
                {fixed ? "" : visIdx + 1}
              </td>

              {/* ---- Назва ---- */}
              <td className="border px-1">
                {fixed ? (
                  f.label
                ) : (
                  <label htmlFor={`label-${f.id}`}>
                    <Input
                      id={`label-${f.id}`}
                      name={`label-${f.id}`}
                      value={f.label}
                      onChange={(e) => update(f.id, { label: e.target.value })}
                    />
                  </label>
                )}
              </td>

              {/* ---- Тип ---- */}
              <td className="border px-1">
                {fixed ? (
                  f.type
                ) : (
                  <label htmlFor={`type-${f.id}`}>
                    <select
                      id={`type-${f.id}`}
                      name={`type-${f.id}`}
                      value={f.type}
                      onChange={(e) => update(f.id, { type: e.target.value })}
                    >
                      <option value="text">text</option>
                      <option value="select">select</option>
                      <option value="calc">calc</option>
                      <option value="img">img</option>
                    </select>
                  </label>
                )}
              </td>

              {/* ---- Кнопка «Коорд.» ---- */}
              <td className="border px-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSetActive(f.id)}
                >
                  Коорд.
                </Button>
              </td>

              {/* ---- X / Y ---- */}
              <td className="border px-1">
                <label html={`x-${f.id}`}>
                  {" "}
                  <Input
                    id={`x-${f.id}`}
                    name={`x-${f.id}`}
                    className="w-16 mx-auto"
                    type="number"
                    step="0.0001"
                    value={Number.isFinite(f.x) ? f.x : ""}
                    onChange={(e) => update(f.id, { x: +e.target.value })}
                  />
                </label>
              </td>
              <td className="border px-1">
                <label html={`y-${f.id}`}>
                  <Input
                    id={`y-${f.id}`}
                    name={`y-${f.id}`}
                    className="w-16 mx-auto"
                    type="number"
                    step="0.0001"
                    value={Number.isFinite(f.y) ? f.y : ""}
                    onChange={(e) => update(f.id, { y: +e.target.value })}
                  />
                </label>
              </td>

              {/* ---- Sz ---- */}
              <td className="border px-1">
                <label html={`sz-${f.id}`}>
                  <Input
                    id={`sz-${f.id}`}
                    name={`sz-${f.id}`}
                    className="w-14 mx-auto"
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
                </label>
              </td>

              {/* ---- Color ---- */}
              <td className="border px-1">
                {f.type === "img" ? null : (
                  <label htmlFor={`color-${f.id}`}>
                    <input
                      id={`color-${f.id}`}
                      name={`color-${f.id}`}
                      type="color"
                      value={f.color || "#000000"}
                      onChange={(e) => update(f.id, { color: e.target.value })}
                    />
                  </label>
                )}
              </td>

              {/* ---- Font ---- */}
              <td className="border px-1">
                {f.type === "img" ? null : (
                  <label htmlFor={`font-${f.id}`}>
                    <select
                      id={`font-${f.id}`}
                      name={`font-${f.id}`}
                      autoComplete="off"
                      value={f.font || fonts[0]}
                      onChange={(e) => update(f.id, { font: e.target.value })}
                    >
                      {fonts.map((fn) => (
                        <option key={fn}>{fn}</option>
                      ))}
                    </select>
                  </label>
                )}
              </td>

              {/* ---- Bold / Italic / Underline ---- */}
              <td className="border px-1 space-x-1">
                {f.type === "img" ? null : (
                  <>
                    <Button
                      size="sm"
                      variant={f.bold ? "default" : "outline"}
                      onClick={() => toggle(f.id, "bold")}
                    >
                      B
                    </Button>
                    <Button
                      size="sm"
                      variant={f.italic ? "default" : "outline"}
                      onClick={() => toggle(f.id, "italic")}
                    >
                      I
                    </Button>
                    <Button
                      size="sm"
                      variant={f.underline ? "default" : "outline"}
                      onClick={() => toggle(f.id, "underline")}
                    >
                      U
                    </Button>
                  </>
                )}
              </td>

              {/* ---- Demo text ---- */}
              <td className="border px-1">
                {f.type === "img" ? null : (
                  <label htmlFor={`demo-${f.id}`}>
                    <Input
                      id={`demo-${f.id}`}
                      name={`demo-${f.id}`}
                      autoComplete="off"
                      value={f.demo || ""}
                      onChange={(e) => update(f.id, { demo: e.target.value })}
                    />
                  </label>
                )}
              </td>

              {/* ---- Render toggle ---- */}
              <td className="border px-1">
                <label htmlFor={`isRender${f.id}`}>
                  <input
                    id={`isRender${f.id}`}
                    name={`isRender${f.id}`}
                    type="checkbox"
                    checked={f.render !== false}
                    onChange={(e) => update(f.id, { render: e.target.checked })}
                  />
                </label>
              </td>

              {/* ---- Delete ---- */}
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
  );
}
