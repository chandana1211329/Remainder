import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Configured with 'dark' theme and 'violet' accent color by default
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || 'violet');

  useEffect(() => {
    // Save to local storage
    localStorage.setItem('theme', theme);
    localStorage.setItem('accentColor', accentColor);

    // Apply accent class to document body
    const doc = document.documentElement;
    
    // Remove existing theme classes
    doc.classList.remove('theme-violet', 'theme-blue', 'theme-emerald', 'theme-amber', 'theme-rose');
    
    // Add active accent class
    doc.classList.add(`theme-${accentColor}`);

    // Set dark/light class
    if (theme === 'dark') {
      doc.classList.add('dark');
    } else {
      doc.classList.remove('dark');
    }
  }, [theme, accentColor]);

  const updateAccentColor = (color) => {
    const validColors = ['violet', 'blue', 'emerald', 'amber', 'rose'];
    if (validColors.includes(color)) {
      setAccentColor(color);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, updateAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
