// SidebarMenu.jsx — оновлено: динамічне зчитування settings через Context + покращена логіка "Інші"
import React, { useState, useEffect, useRef, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Settings, LogOut } from "lucide-react";
import SettingsModal from "../layout/SettingsModal";
import { SettingsContext } from "../../context/SettingsContext";

// Tailwind класи
const btnBase =
  "w-full flex justify-between items-center font-semibold transition-colors duration-200 ease-in-out";
const cls = (active) =>
  active ? "text-orange-400 font-semibold" : "text-slate-300";

export default function SidebarMenu({ roles, onLogout, templates = [] }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const { products, locations } = useContext(SettingsContext);

  const getCat = (tpl) => {
    const f = tpl.fields?.find(
      (x) => x.label === "Продукт" && x.type === "selectOnce"
    );
    const id = Array.isArray(f?.options) ? f.options[0] : null;
    const match = products.find((p) => p.id === id);
    return match?.name || "Інші";
  };

  const getLoc = (tpl) => {
    const f = tpl.fields?.find(
      (x) => x.label === "Локація" && x.type === "selectOnce"
    );
    const id = Array.isArray(f?.options) ? f.options[0] : null;
    const match = locations.find((l) => l.id === id);
    return match?.name || "Інше";
  };

  const filteredTemplates =
    roles.includes("lab") &&
    !roles.includes("manager") &&
    !roles.includes("supervisor")
      ? templates.filter((t) => {
          const f = t.fields?.find(
            (x) => x.label === "Локація" && x.type === "selectOnce"
          );
          const id = Array.isArray(f?.options) ? f.options[0] : null;
          return id === user.location;
        })
      : templates;

  const grouped = filteredTemplates.reduce((acc, tpl) => {
    const loc = getLoc(tpl);
    const cat = getCat(tpl);
    if (!acc[loc]) acc[loc] = {};
    if (!acc[loc][cat]) acc[loc][cat] = [];
    acc[loc][cat].push(tpl);
    return acc;
  }, {});

  const [showModal, setShowModal] = useState(false);
  const [open, setOpen] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("sbOpen")) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("sbOpen", JSON.stringify(open));
  }, [open]);

  const loc = useLocation();
  const nav = useNavigate();
  const didRestore = useRef(false);

  useEffect(() => {
    if (didRestore.current || !templates.length) return;
    didRestore.current = true;
    const lastId = localStorage.getItem("selectedTemplateId");
    const tpl = templates.find((t) => t.id === lastId);
    if (!tpl) return;
    const cat = getCat(tpl);
    const loc = getLoc(tpl);
    setOpen({
      journal: true,
      templates: false,
      users: false,
      settings: false,
      [loc]: true,
      [`${loc}_${cat}`]: true,
    });
    nav("/journal", { replace: true, state: { selectedId: tpl.id } });
  }, [templates, nav]);

  const openOnly = (lvl1, lvl2 = null, lvl3 = null) => {
    setOpen((prev) => {
      const rootKeys = ["journal", "templates", "users", "settings"];
      const next = {};
      for (const key of rootKeys) {
        if (key === lvl1) next[key] = true;
      }
      if (lvl2) next[lvl2] = true;
      if (lvl3) next[lvl3] = true;
      return next;
    });
  };

  const isActive = (path) => loc.pathname === path;
  const isActiveTpl = (tplId) => loc.state?.selectedId === tplId;

  const handleTpl = (path, tpl) => {
    localStorage.setItem("selectedTemplateId", tpl.id);
    nav(path, { state: { selectedId: tpl.id } });
  };

  const renderGroupedTemplates = (path) => {
    return Object.entries(grouped).map(([loc, cats]) => {
      return (
        <li key={loc}>
          <button
            className={`${btnBase} px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-sm`}
            onClick={() =>
              setOpen((prev) => {
                const newState = { ...prev };
                Object.keys(newState).forEach((key) => {
                  if (
                    !["journal", "templates", "users", "settings"].includes(key)
                  ) {
                    newState[key] = false;
                  }
                });
                newState[loc] = !prev[loc];
                return newState;
              })
            }
          >
            {loc}
            {open[loc] ? <ChevronDown /> : <ChevronRight />}
          </button>
          {open[loc] && (
            <ul className="ml-4 space-y-1 mt-1 transition-all duration-300 ease-in-out">
              {[...products.map((p) => p.name), "Інші"].map((cat) => {
                const arr = cats[cat] || [];
                if (!arr.length) return null;
                return (
                  <li key={cat}>
                    <button
                      className={`${btnBase} px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-sm mt-1`}
                      onClick={() =>
                        setOpen((prev) => {
                          const newState = { ...prev };
                          Object.keys(newState).forEach((key) => {
                            if (key.startsWith(`${loc}_`)) {
                              newState[key] = false;
                            }
                          });
                          newState[loc] = true;
                          newState[`${loc}_${cat}`] = !prev[`${loc}_${cat}`];
                          return newState;
                        })
                      }
                    >
                      {cat}
                      {open[`${loc}_${cat}`] ? (
                        <ChevronDown />
                      ) : (
                        <ChevronRight />
                      )}
                    </button>
                    {open[`${loc}_${cat}`] && (
                      <ul className="ml-4 space-y-1 mt-1 transition-all duration-300 ease-in-out">
                        {arr.map((t) => (
                          <li key={t.id}>
                            <span
                              className={`${cls(
                                isActive(path) && isActiveTpl(t.id)
                              )} block text-left px-6 py-1.5 w-full hover:bg-slate-600 rounded-sm cursor-pointer`}
                              onClick={() => handleTpl(path, t)}
                            >
                              {t.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      );
    });
  };

  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-slate-900 text-white flex flex-col z-50">
      <div className="p-4 border-b border-slate-700">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-sm">{user.name}</span>
          <div className="flex space-x-2">
            <button onClick={() => setShowModal(true)}>
              <Settings className="w-4 h-4 text-slate-400 hover:text-white" />
            </button>
            <button onClick={onLogout}>
              <LogOut className="w-4 h-4 text-red-500 hover:text-white" />
            </button>
          </div>
        </div>
        <h2 className="text-xl font-bold">Меню</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <ul className="space-y-2 text-sm select-none">
          {(roles.includes("lab") || roles.includes("manager")) && (
            <li>
              <button
                className={`${btnBase} px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-sm`}
                onClick={() => openOnly(open.journal ? null : "journal")}
              >
                Журнал аналізів
                {open.journal ? <ChevronDown /> : <ChevronRight />}
              </button>
              {open.journal && (
                <ul className="ml-4 space-y-1 mt-2 transition-all duration-300 ease-in-out">
                  {renderGroupedTemplates("/journal")}
                </ul>
              )}
            </li>
          )}

          {(roles.includes("constructor") || roles.includes("supervisor")) && (
            <li>
              <button
                className={`${btnBase} px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-sm`}
                onClick={() => openOnly(open.templates ? null : "templates")}
              >
                Шаблони
                {open.templates ? <ChevronDown /> : <ChevronRight />}
              </button>
              {open.templates && (
                <ul className="ml-4 space-y-1 mt-2">
                  <li>
                    <Link
                      to="/template"
                      className={cls(
                        isActive("/template") && !loc.state?.selectedId
                      )}
                      onClick={() => openOnly("templates")}
                    >
                      Створити шаблон
                    </Link>
                  </li>
                  {renderGroupedTemplates("/template")}
                  <li>
                    <Link
                      to="/template-logs"
                      className={cls(isActive("/template-logs"))}
                      onClick={() => openOnly("templates")}
                    >
                      Журнал змін шаблонів
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          )}

          {roles.includes("supervisor") && (
            <li>
              <button
                className={`${btnBase} px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-sm`}
                onClick={() => openOnly(open.users ? null : "users")}
              >
                Користувачі
                {open.users ? <ChevronDown /> : <ChevronRight />}
              </button>
              {open.users && (
                <ul className="ml-4 space-y-1 mt-2">
                  <li>
                    <Link
                      to="/register-user"
                      className={cls(isActive("/register-user"))}
                    >
                      Користувачі
                    </Link>
                  </li>
                  <li>
                    <Link to="/logs" className={cls(isActive("/logs"))}>
                      Журнал змін користувачів
                    </Link>
                  </li>
                </ul>
              )}
            </li>
          )}

          <li>
            <button
              className={`${btnBase} px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-sm`}
              onClick={() => openOnly(open.settings ? null : "settings")}
            >
              Налаштування
              {open.settings ? <ChevronDown /> : <ChevronRight />}
            </button>
            {open.settings && (
              <ul className="ml-4 space-y-1 mt-2">
                <li>
                  <Link
                    to="/settings-app"
                    className={cls(isActive("/settings-app"))}
                  >
                    Налаштування системи
                  </Link>
                </li>
                <li>
                  <Link to="/stamp" className={cls(isActive("/stamp"))}>
                    Печатка
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </div>

      {showModal && (
        <SettingsModal user={user} onClose={() => setShowModal(false)} />
      )}
    </aside>
  );
}
