import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import themes from './themes';

interface ThemeCtx {
  theme: string;
  setTheme: (id: string) => void;
  isDark: boolean;
}

const STORAGE_KEY = 'microgpt-theme';

const ThemeContext = createContext<ThemeCtx>({
  theme: 'midnight',
  setTheme: () => {},
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeRaw] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && themes.some(t => t.id === stored)) return stored;
    return 'midnight';
  });

  const meta = themes.find(t => t.id === theme) ?? themes[0];

  const setTheme = useCallback((id: string) => {
    setThemeRaw(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark: meta.isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
