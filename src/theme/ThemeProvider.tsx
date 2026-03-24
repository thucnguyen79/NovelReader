import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ThemeColors } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colors: ThemeColors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  colors: Colors.dark,
  isDark: true,
  themeMode: 'system',
  setThemeMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    AsyncStorage.getItem('themeMode').then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemeModeState(stored);
      }
    });
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    AsyncStorage.setItem('themeMode', mode);
  };

  const isDark =
    themeMode === 'system' ? systemScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
