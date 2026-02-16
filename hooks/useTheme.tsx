import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NEO } from '../constants/theme';
import * as SecureStore from 'expo-secure-store';

interface ThemeContextValue {
  highlight: string;
  setHighlight: (color: string) => void;
  neo: typeof NEO;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const HIGHLIGHT_KEY = 'shamir_highlight_color';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [highlight, setHighlightState] = useState(NEO.defaultHighlight);

  const setHighlight = useCallback(async (color: string) => {
    setHighlightState(color);
    await SecureStore.setItemAsync(HIGHLIGHT_KEY, color);
  }, []);

  React.useEffect(() => {
    SecureStore.getItemAsync(HIGHLIGHT_KEY).then((saved) => {
      if (saved) setHighlightState(saved);
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ highlight, setHighlight, neo: NEO }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
