// SidebarMenu.jsx — адаптація до theme === "linde" з підтримкою primary, secondary, hover через CSS custom properties
import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronRight, Settings, LogOut } from "lucide-react";
import SettingsModal from "../layout/SettingsModal";
import { SettingsContext } from "../../context/SettingsContext";
//import { useTheme } from "@/context/ThemeContext";

const btnBase =
  "w-full flex justify-between items-center font-semibold transition-colors duration-200 ease-in-out";
const cls = (active) =>
  active ? "text-orange-500 font-semibold" : "text-text/70 hover:text-text";

export default function SidebarMenu({ onLogout, templates = [] }) {
  // const { theme } = useTheme();
  const user = JSON.parse(localStorage.getItem("user"));
  const roles = user?.roles || [];
  const { products, locations } = useContext(SettingsContext);

  const getCat = useCallback(
    (tpl) => {
      const f = tpl.fields?.find(
        (x) => x.label === "Продукт" && x.type === "selectOnce"
      );
      const id = Array.isArray(f?.options) ? f.options[0] : null;
      const match = products.find((p) => p.id === id);
      return match?.name || "Інші";
    },
    [products]
  );

  const getLoc = useCallback(
    (tpl) => {
      const f = tpl.fields?.find(
        (x) => x.label === "Локація" && x.type === "selectOnce"
      );
      const id = Array.isArray(f?.options) ? f.options[0] : null;
      const match = locations.find((l) => l.id === id);
      return match?.name || "Інше";
    },
    [locations]
  );

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
  }, [templates, nav, getCat, getLoc]);

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
    return Object.entries(grouped).map(([loc, cats]) => (
      <li key={loc}>
        <button
          className={`${btnBase} pl-5 pr-3 py-2 rounded-sm bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)]`}
          onClick={() => {
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
            });
          }}
        >
          {loc} {open[loc] ? <ChevronDown /> : <ChevronRight />}
        </button>
        {open[loc] && (
          <ul className="transition-all duration-300 ease-in-out">
            {[...products.map((p) => p.name), "Інші"].map((cat) => {
              const arr = cats[cat] || [];
              if (!arr.length) return null;
              return (
                <li key={cat}>
                  <button
                    className={`${btnBase} pl-7 pr-3 py-2 rounded-sm bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)]`}
                    onClick={() => {
                      setOpen((prev) => {
                        const newState = { ...prev };
                        Object.keys(newState).forEach((key) => {
                          if (key.startsWith(`${loc}_`)) newState[key] = false;
                        });
                        newState[loc] = true;
                        newState[`${loc}_${cat}`] = !prev[`${loc}_${cat}`];
                        return newState;
                      });
                    }}
                  >
                    {"    "}
                    {cat}{" "}
                    {open[`${loc}_${cat}`] ? <ChevronDown /> : <ChevronRight />}
                  </button>
                  {open[`${loc}_${cat}`] && (
                    <ul className="">
                      {arr.map((t) => (
                        <li key={t.id}>
                          <span
                            className={`${cls(
                              isActive(path) && isActiveTpl(t.id)
                            )} block text-left pl-9 pr-3 py-2 w-full rounded-sm cursor-pointer hover:bg-[var(--color-hover)]`}
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
    ));
  };

  return (
    <aside className="rounded-l-2xl fixed left-0 top-0 w-64 h-screen flex flex-col z-50 bg-[var(--color-bg)] text-[var(--color-text)]">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold text-sm">{user.name}</span>
          <div className="flex space-x-2">
            <button onClick={() => setShowModal(true)}>
              <Settings className="w-4 h-4 text-[var(--color-text)] opacity-70 hover:opacity-100" />
            </button>
            <button onClick={onLogout}>
              <LogOut className="w-4 h-4 text-red-500 hover:text-[var(--color-text)]" />
            </button>
          </div>
        </div>
        <h2 className="text-xl font-bold pb-2">Меню</h2>
      </div>

      <div className="flex-grow overflow-y-auto p-4">
        <ul className="text-sm select-none">
          {(roles.includes("lab") || roles.includes("manager")) && (
            <li>
              <button
                className={`${btnBase} px-3 py-2 rounded-sm bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)]`}
                onClick={() => openOnly(open.journal ? null : "journal")}
              >
                Журнал аналізів
                {open.journal ? <ChevronDown /> : <ChevronRight />}
              </button>
              {open.journal && (
                <ul className="transition-all duration-300 ease-in-out">
                  {renderGroupedTemplates("/journal")}
                </ul>
              )}
            </li>
          )}

          {(roles.includes("constructor") || roles.includes("supervisor")) && (
            <li>
              <button
                className={`${btnBase} px-3 py-2 rounded-sm bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)]`}
                onClick={() => openOnly(open.templates ? null : "templates")}
              >
                Шаблони
                {open.templates ? <ChevronDown /> : <ChevronRight />}
              </button>

              {open.templates && (
                <ul className="">
                  <Link
                    to="/template"
                    onClick={() => {
                      openOnly("templates");
                      localStorage.setItem("selectedTemplateId", "");
                    }}
                  >
                    <li
                      className={`py-2 pl-5 bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)] ${
                        localStorage.getItem("selectedTemplateId") === ""
                          ? cls(isActive("/template"))
                          : ""
                      }`}
                    >
                      <span className="">Створити шаблон</span>
                    </li>
                  </Link>

                  {renderGroupedTemplates("/template")}

                  <Link
                    to="/template-logs"
                    onClick={() => openOnly("templates")}
                  >
                    <li
                      className={`py-2 pl-5 bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)] ${cls(
                        isActive("/template-logs")
                      )}`}
                    >
                      Журнал змін шаблонів
                    </li>
                  </Link>
                </ul>
              )}
            </li>
          )}

          {roles.includes("supervisor") && (
            <li>
              <button
                className={`${btnBase} px-3 py-2 rounded-sm bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)]`}
                onClick={() => openOnly(open.users ? null : "users")}
              >
                Користувачі
                {open.users ? <ChevronDown /> : <ChevronRight />}
              </button>
              {open.users && (
                <ul className="">
                  <Link to="/register-user">
                    <li
                      className={`py-2 pl-5 bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)] ${cls(
                        isActive("/register-user")
                      )}`}
                    >
                      Користувачі
                    </li>
                  </Link>
                  <Link to="/logs">
                    <li
                      className={`py-2 pl-5 bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)] ${cls(
                        isActive("/logs")
                      )}`}
                    >
                      Журнал змін користувачів
                    </li>
                  </Link>
                </ul>
              )}
            </li>
          )}

          <li>
            <button
              className={`${btnBase} px-3 py-2 rounded-sm bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)]`}
              onClick={() => openOnly(open.settings ? null : "settings")}
            >
              Налаштування
              {open.settings ? <ChevronDown /> : <ChevronRight />}
            </button>
            {open.settings && (
              <ul className="">
                <Link to="/settings-app">
                  <li
                    className={`py-2 pl-5 bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)] ${cls(
                      isActive("/settings-app")
                    )}`}
                  >
                    Налаштування системи
                  </li>
                </Link>
                <Link to="/stamp">
                  <li
                    className={`py-2 pl-5 bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-hover)] ${cls(
                      isActive("/stamp")
                    )}`}
                  >
                    Печатка
                  </li>
                </Link>
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
