import { create } from "zustand";

export const useThemeStore = create((set, get) => ({
  theme: localStorage.getItem("chat-theme") || "system",
  activeTheme: "light", // This will be calculated
  setTheme: (theme) => {
    localStorage.setItem("chat-theme", theme);
    set({ theme });
    get().updateActiveTheme();
  },
  updateActiveTheme: () => {
    const { theme } = get();
    let calculatedTheme = theme;
    
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      calculatedTheme = prefersDark ? "dark" : "light";
    }
    
    set({ activeTheme: calculatedTheme });
    
    if (calculatedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },
  initThemeListener: () => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (get().theme === "system") {
        get().updateActiveTheme();
      }
    };
    mediaQuery.addEventListener("change", listener);
    get().updateActiveTheme();
    return () => mediaQuery.removeEventListener("change", listener);
  },
}));
