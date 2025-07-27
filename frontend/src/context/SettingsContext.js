import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const SettingsContext = createContext({
  products: [],
  locations: [],
  setProducts: () => {},
  setLocations: () => {},
  setSettings: () => {},
});

export const SettingsProvider = ({ children }) => {
  const [products, setProductsState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("products")) || [];
    } catch {
      return [];
    }
  });

  const [locations, setLocationsState] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("locations")) || [];
    } catch {
      return [];
    }
  });

  const setProducts = (newProducts) => {
    setProductsState((prev) => {
      const same = JSON.stringify(prev) === JSON.stringify(newProducts);
      if (!same) {
        localStorage.setItem("products", JSON.stringify(newProducts));
        return newProducts;
      }
      return prev;
    });
  };

  const setLocations = (newLocations) => {
    setLocationsState((prev) => {
      const same = JSON.stringify(prev) === JSON.stringify(newLocations);
      if (!same) {
        localStorage.setItem("locations", JSON.stringify(newLocations));
        return newLocations;
      }
      return prev;
    });
  };

  const setSettings = (settings) => {
    if (Array.isArray(settings.products)) setProducts(settings.products);
    if (Array.isArray(settings.locations)) setLocations(settings.locations);
  };

  useEffect(() => {
    const needFetch = products.length === 0 || locations.length === 0;
    if (!needFetch) return;

    Promise.all([
      axios.get("/api/settings/products"),
      axios.get("/api/settings/locations"),
    ])
      .then(([productsRes, locationsRes]) => {
        setProducts(productsRes.data);
        setLocations(locationsRes.data);
      })
      .catch((err) => {
        console.warn("Не вдалося отримати settings", err);
      });
  }, [products.length, locations.length]); // додано залежності

  return (
    <SettingsContext.Provider
      value={{ products, locations, setProducts, setLocations, setSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
