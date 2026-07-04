import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "hello-kitty" | "cinnamoroll";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("app-theme");
    return (saved === "hello-kitty" || saved === "cinnamoroll") ? saved : "hello-kitty";
  });

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    document.documentElement.classList.remove("theme-hello-kitty", "theme-cinnamoroll");
    document.documentElement.classList.add(`theme-${theme}`);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "hello-kitty" ? "cinnamoroll" : "hello-kitty");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
