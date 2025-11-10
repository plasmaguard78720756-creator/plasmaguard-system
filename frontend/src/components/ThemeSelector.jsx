import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeSelector = () => {
  const { 
    theme, 
    currentTheme, 
    predefinedThemes, 
    changeTheme, 
    updateCustomColor,
    resetToTheme,
    isThemePanelOpen, 
    setIsThemePanelOpen 
  } = useTheme();

  const [activeTab, setActiveTab] = useState('presets');
  const [customColorValues, setCustomColorValues] = useState({
    primary: theme.colors.primary,
    secondary: theme.colors.secondary,
    background: theme.colors.background,
    card: theme.colors.card,
    text: theme.colors.text
  });

  const handleCustomColorChange = (colorKey, value) => {
    setCustomColorValues(prev => ({ ...prev, [colorKey]: value }));
    updateCustomColor(colorKey, value);
  };

  const applyCustomColors = () => {
    Object.entries(customColorValues).forEach(([key, value]) => {
      updateCustomColor(key, value);
    });
  };

  if (!isThemePanelOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-theme-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-theme-primary text-white p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Personalizar Tema</h2>
            <button
              onClick={() => setIsThemePanelOpen(false)}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-blue-100 mt-2">Personaliza la apariencia de PlasmaGuard</p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-3 font-medium ${
                activeTab === 'presets' 
                  ? 'text-theme border-b-2 border-theme-primary' 
                  : 'text-theme-muted'
              }`}
            >
              Temas Predefinidos
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 py-3 font-medium ${
                activeTab === 'custom' 
                  ? 'text-theme border-b-2 border-theme-primary' 
                  : 'text-theme-muted'
              }`}
            >
              Personalizado
            </button>
          </div>

          {activeTab === 'presets' && (
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(predefinedThemes).map(([key, themeData]) => (
                <div
                  key={key}
                  onClick={() => changeTheme(key)}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    currentTheme === key 
                      ? 'border-theme-primary ring-2 ring-theme-primary ring-opacity-50' 
                      : 'border-gray-300 hover:border-theme-primary'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: themeData.colors.primary }}
                    ></div>
                    <span className="font-semibold text-theme">{themeData.name}</span>
                  </div>
                  <div className="flex space-x-1">
                    {Object.values(themeData.colors).slice(0, 4).map((color, index) => (
                      <div
                        key={index}
                        className="flex-1 h-8 rounded"
                        style={{ 
                          backgroundColor: typeof color === 'string' ? color : '#fff',
                          backgroundImage: typeof color !== 'string' ? color : 'none'
                        }}
                      ></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme mb-2">
                    Color Primario
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={customColorValues.primary}
                      onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                      className="w-12 h-12 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={customColorValues.primary}
                      onChange={(e) => handleCustomColorChange('primary', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-theme"
                      placeholder="#1e40af"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme mb-2">
                    Color Secundario
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="color"
                      value={customColorValues.secondary}
                      onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                      className="w-12 h-12 rounded border border-gray-300"
                    />
                    <input
                      type="text"
                      value={customColorValues.secondary}
                      onChange={(e) => handleCustomColorChange('secondary', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-theme"
                      placeholder="#dc2626"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme mb-2">
                    Fondo
                  </label>
                  <input
                    type="color"
                    value={customColorValues.background}
                    onChange={(e) => handleCustomColorChange('background', e.target.value)}
                    className="w-full h-12 rounded border border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-theme mb-2">
                    Tarjetas
                  </label>
                  <input
                    type="color"
                    value={customColorValues.card}
                    onChange={(e) => handleCustomColorChange('card', e.target.value)}
                    className="w-full h-12 rounded border border-gray-300"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-theme mb-3">Vista Previa</h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div 
                    className="h-8 rounded flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: customColorValues.primary }}
                  >
                    Primario
                  </div>
                  <div 
                    className="h-8 rounded flex items-center justify-center text-white font-medium"
                    style={{ backgroundColor: customColorValues.secondary }}
                  >
                    Secundario
                  </div>
                  <div 
                    className="h-8 rounded flex items-center justify-center text-theme border border-gray-300 font-medium"
                    style={{ backgroundColor: customColorValues.card }}
                  >
                    Tarjeta
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={applyCustomColors}
                  className="flex-1 bg-theme-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
                >
                  Aplicar Colores Personalizados
                </button>
                <button
                  onClick={() => resetToTheme('default')}
                  className="px-6 bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;