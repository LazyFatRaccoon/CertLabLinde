export default function AnalysisList({ list, activeId, onSelect }) {
  return (
    <aside className="w-64 border-r h-full overflow-y-auto">
      <div className="p-3 font-semibold">Схеми</div>
      {list.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={
            "block w-full text-left px-3 py-2 hover:bg-gray-100 " +
            (activeId === t.id ? "bg-gray-200 font-medium" : "")
          }
        >
          {t.name}
        </button>
      ))}
    </aside>
  );
}
