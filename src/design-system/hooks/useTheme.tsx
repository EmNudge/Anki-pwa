import { createContext, useContext, JSX, createSignal, onMount } from "solid-js";

export type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: () => Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>();

export interface ThemeProviderProps {
  children: JSX.Element;
  defaultTheme?: Theme;
}

export function ThemeProvider(props: ThemeProviderProps) {
  const [theme, setThemeSignal] = createSignal<Theme>(
    props.defaultTheme ?? "light"
  );

  onMount(() => {
    // Apply theme on mount
    document.documentElement.setAttribute("data-theme", theme());

    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  });

  const setTheme = (newTheme: Theme) => {
    setThemeSignal(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme() === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
