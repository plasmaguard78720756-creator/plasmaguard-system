import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

// Temas predefinidos
const predefinedThemes = {
  default: {
    name: 'Default',
    colors: {
      primary: '#1e40af',
      secondary: '#dc2626', 
      success: '#16a34a',
      warning: '#d97706',
      background: 'linear-gradient(to bottom right, #f0f9ff, #e0f2fe)',
      card: '#ffffff',
      text: '#1f2937',
      textMuted: '#6b7280'
    }
  },
  dark: {
    name: 'Dark',
    colors: {
      primary: '#3b82f6',
      secondary: '#ef4444',
      success: '#10b981',
      warning: '#f59e0b',
      background: 'linear-gradient(to bottom right, #111827, #1f2937)',
      card: '#374151',
      text: '#f9fafb',
      textMuted: '#d1d5db'
    }
  },
  medical: {
    name: 'Medical',
    colors: {
      primary: '#059669',
      secondary: '#dc2626',
      success: '#059669',
      warning: '#d97706',
      background: 'linear-gradient(to bottom right, #f0fdf4, #dcfce7)',
      card: '#ffffff',
      text: '#064e3b',
      textMuted: '#4b5563'
    }
  },
  warm: {
    name: 'Warm',
    colors: {
      primary: '#ea580c',
      secondary: '#dc2626',
      success: '#16a34a',
      warning: '#d97706',
      background: 'linear-gradient(to bottom right, #fff7ed, #fed7aa)',
      card: '#ffffff',
      text: '#431407',
      textMuted: '#78716c'
    }
  }
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [customColors, setCustomColors] = useState({});
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);

  // Cargar tema guardado al iniciar
  useEffect(() => {
    const savedTheme = localStorage.getItem('plasmaguard_theme');
    const savedCustomColors = localStorage.getItem('plasmaguard_custom_colors');
    
    if (savedTheme && predefinedThemes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
    
    if (savedCustomColors) {
      setCustomColors(JSON.parse(savedCustomColors));
    }
  }, []);

  // Combinar tema base con colores personalizados
  const theme = {
    ...predefinedThemes[currentTheme],
    colors: {
      ...predefinedThemes[currentTheme].colors,
      ...customColors
    }
  };

  const changeTheme = (themeName) => {
    setCurrentTheme(themeName);
    setCustomColors({});
    localStorage.setItem('plasmaguard_theme', themeName);
    localStorage.removeItem('plasmaguard_custom_colors');
  };

  const updateCustomColor = (colorKey, value) => {
    const newCustomColors = { ...customColors, [colorKey]: value };
    setCustomColors(newCustomColors);
    localStorage.setItem('plasmaguard_custom_colors', JSON.stringify(newCustomColors));
  };

  const resetToTheme = (themeName) => {
    changeTheme(themeName);
  };

  const value = {
    theme,
    currentTheme: currentTheme,
    predefinedThemes,
    changeTheme,
    updateCustomColor,
    resetToTheme,
    isThemePanelOpen,
    setIsThemePanelOpen
  };

  return (
    <ThemeContext.Provider value={value}>
      <div style={{ 
        '--color-primary': theme.colors.primary,
        '--color-secondary': theme.colors.secondary,
        '--color-success': theme.colors.success,
        '--color-warning': theme.colors.warning,
        '--bg-gradient': theme.colors.background,
        '--color-card': theme.colors.card,
        '--color-text': theme.colors.text,
        '--color-text-muted': theme.colors.textMuted
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};