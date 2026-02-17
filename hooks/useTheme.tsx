import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NEO } from '../constants/theme';
import * as SecureStore from 'expo-secure-store';

interface ThemeContextValue {
  highlight: string;
  setHighlight: (color: string) => void;
  borderWidth: number;
  setBorderWidth: (width: number) => void;
  neo: typeof NEO;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const HIGHLIGHT_KEY = 'shamir_highlight_color';
const BORDER_WIDTH_KEY = 'shamir_border_width';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [highlight, setHighlightState] = useState<string>(NEO.defaultHighlight);
  const [borderWidth, setBorderWidthState] = useState<number>(NEO.borderWidth);

  const setHighlight = useCallback(async (color: string) => {
    setHighlightState(color);
    await SecureStore.setItemAsync(HIGHLIGHT_KEY, color);
  }, []);

  const setBorderWidth = useCallback(async (width: number) => {
    setBorderWidthState(width);
    await SecureStore.setItemAsync(BORDER_WIDTH_KEY, String(width));
  }, []);

  React.useEffect(() => {
    SecureStore.getItemAsync(HIGHLIGHT_KEY).then((saved) => {
      if (saved) setHighlightState(saved);
    });
    SecureStore.getItemAsync(BORDER_WIDTH_KEY).then((saved) => {
      if (saved) setBorderWidthState(Number(saved));
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ highlight, setHighlight, borderWidth, setBorderWidth, neo: NEO }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
