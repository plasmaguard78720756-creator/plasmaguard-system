import React from 'react';

const ChartLoading = ({ message = "Cargando datos para gráficas..." }) => {
  return (
    <div className="bg-theme-card rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
          <p className="text-theme-muted text-lg">{message}</p>
          <p className="text-gray-400 text-sm mt-2">Obteniendo datos históricos del sistema...</p>
        </div>
      </div>
    </div>
  );
};

export default ChartLoading;