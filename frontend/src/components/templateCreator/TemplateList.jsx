import { Button } from "../ui/button";

export default function TemplateList({
  templates,
  activeId,
  onSelect,
  onCreateNew,
}) {
  return (
    <aside className="w-72 border-r p-4 space-y-2 overflow-y-auto">
      <Button className="w-full" onClick={onCreateNew}>
        + Новий шаблон
      </Button>

      {templates.map((t) => (
        <div
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`p-2 rounded cursor-pointer hover:bg-slate-100
            ${t.id === activeId ? "bg-sky-100 font-medium" : ""}`}
        >
          {t.name}
        </div>
      ))}
    </aside>
  );
}
