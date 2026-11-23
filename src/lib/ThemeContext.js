'use client';

import React, { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'white',
  setTheme: () => {},
  toggleTheme: () => {},
  isWhite: true,
  isDark: false,
  mounted: true,
});

export function ThemeProvider({ children }) {
  useEffect(() => {
    try {
      localStorage.setItem('innolab_theme', 'white');
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('white');
    } catch (e) {
      // localStorage may be unavailable
    }
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: 'white',
        setTheme: () => {},
        toggleTheme: () => {},
        isWhite: true,
        isDark: false,
        mounted: true,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
