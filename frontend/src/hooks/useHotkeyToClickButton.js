import { useEffect } from "react";

export function useHotkeyToClickButton(hotkey, buttonId) {
  useEffect(() => {
    const handler = (e) => {
      if (
        (hotkey === "Ctrl+Enter" && e.ctrlKey && e.key === "Enter") ||
        (hotkey === "Alt+A" && e.altKey && e.key.toLowerCase() === "a") ||
        (hotkey === "Ctrl+`" && e.ctrlKey && e.key === "`") ||
        (hotkey === "Ctrl+`" && e.ctrlKey && e.key === "'") ||
        (hotkey === "Ctrl+`" && e.ctrlKey && e.key === "ё")
      ) {
        const button = document.getElementById(buttonId);
        if (button) button.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hotkey, buttonId]);
}
