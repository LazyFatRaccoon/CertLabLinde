// src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const defaultTheme = "linde";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(null); // спочатку null

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setTheme(saved || defaultTheme);
  }, []);

  useEffect(() => {
    if (!theme) return; // щоб не спрацьовувало на стартовий null

    document.documentElement.classList.remove("light", "dark", "linde");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {/* Поки тема не визначена — не рендеримо застосунок */}
      {theme ? children : null}
    </ThemeContext.Provider>
  );
};
export const useTheme = () => useContext(ThemeContext);
