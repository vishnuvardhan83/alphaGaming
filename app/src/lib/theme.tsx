import React, { createContext, useContext, useEffect, useState, useTransition } from "react";

export type Theme = "green" | "dark" | "light" | "blue";

export interface ThemeOption {
  key: Theme;
  label: string;
  dotColor: string;
  glowColor: string;
  description: string;
}

export const THEMES: ThemeOption[] = [
  {
    key: "green",
    label: "Green (Default)",
    dotColor: "#1ee07a",
    glowColor: "rgba(30, 224, 122, 0.4)",
    description: "Classic AlphaQ neon green arena look",
  },
  {
    key: "dark",
    label: "Dark",
    dotColor: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.5)",
    description: "Midnight obsidian with electric neon violet",
  },
  {
    key: "light",
    label: "Light",
    dotColor: "#059669",
    glowColor: "rgba(5, 150, 105, 0.3)",
    description: "Clean modern high-contrast daytime theme",
  },
  {
    key: "blue",
    label: "Blue",
    dotColor: "#00d2ff",
    glowColor: "rgba(0, 210, 255, 0.45)",
    description: "Electric cyberpunk cyan and cobalt glow",
  },
];

const THEME_STORAGE_KEY = "aq_theme";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: ThemeOption[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  if (theme === "light") {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  } else {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }
  window.dispatchEvent(new CustomEvent("aq-theme-change", { detail: { theme } }));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "green";
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "green" || saved === "dark" || saved === "light" || saved === "blue") {
      return saved;
    }
    return "green";
  });

  const [, startTransition] = useTransition();

  const setTheme = (newTheme: Theme) => {
    startTransition(() => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch {
        /* storage may fail in incognito */
      }
      applyThemeToDocument(newTheme);
    });
  };

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
