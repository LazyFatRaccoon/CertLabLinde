import { createContext, useState } from "react";

export const SettingsContext = createContext({
  products: [],
  locations: [],
  setProducts: () => {},
  setLocations: () => {},
  setSettings: () => {},
});

export const SettingsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);

  const setSettings = (settings) => {
    if (Array.isArray(settings.products)) setProducts(settings.products);
    if (Array.isArray(settings.locations)) setLocations(settings.locations);
  };

  return (
    <SettingsContext.Provider
      value={{ products, locations, setProducts, setLocations, setSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
