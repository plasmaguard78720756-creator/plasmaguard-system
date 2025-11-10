import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle = () => {
  const { setIsThemePanelOpen } = useTheme();

  return (
    <button
      onClick={() => setIsThemePanelOpen(true)}
      className="fixed bottom-6 right-6 bg-theme-primary text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 group"
      title="Personalizar tema"
    >
      <div className="flex items-center justify-center">
        <svg className="w-6 h-6 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </div>
    </button>
  );
};

export default ThemeToggle;