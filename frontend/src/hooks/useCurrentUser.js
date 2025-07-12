import { useEffect, useState } from "react";

export function useCurrentUser() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") ?? "null") || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const sync = (e) => {
      if (e.key === "user") {
        try {
          setUser(JSON.parse(e.newValue ?? "null") || {});
        } catch {
          setUser({});
        }
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  return user;
}
