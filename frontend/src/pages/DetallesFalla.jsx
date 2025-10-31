import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DetallesFalla = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams(); 

  const fallaDetalle = {
    id: parseInt(id),
    tipo: 'Temperatura',
    descripcion: 'Temperatura fuera de rango permitido para plasma fresco congelado',
    severidad: 'critical',
    fecha: '2024-01-20 10:30:00',
    valor_medido: '-40°C',
    valor_esperado: '-25°C a -35°C',
    sensor_afectado: 'PT100',
    duracion: '15 minutos',
    acciones_recomendadas: 'Verificar sensor PT100 y ajustar temperatura del refrigerador'
  };

  const getSeverityColor = (severidad) => {
    switch (severidad) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityText = (severidad) => {
    switch (severidad) {
      case 'critical': return 'Crítica';
      case 'warning': return 'Advertencia';
      default: return 'Informativa';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-plasma-primary">PLASMAGUARD</h1>
          <p className="text-gray-600 mt-2">Seguridad y Confianza</p>
        </div>

        {/* Información del usuario */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Bienvenido: <span className="text-plasma-primary">{user?.name || 'Usuario'}</span>
              </p>
              <p className="text-gray-600">Acceso: Operador</p>
            </div>
            <button
              onClick={() => navigate('/operador/dashboard')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Detalles de Falla #{fallaDetalle.id}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(fallaDetalle.severidad)}`}>
                {getSeverityText(fallaDetalle.severidad)}
              </span>
            </div>

            {/* Grid de información */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Columna izquierda - Información básica */}
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800 mb-2">Información General</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo de Falla:</span>
                      <span className="font-medium">{fallaDetalle.tipo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sensor Afectado:</span>
                      <span className="font-medium">{fallaDetalle.sensor_afectado}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha y Hora:</span>
                      <span className="font-medium">{fallaDetalle.fecha}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duración:</span>
                      <span className="font-medium">{fallaDetalle.duracion}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">Valores Registrados</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Medido:</span>
                      <span className="font-medium text-red-600">{fallaDetalle.valor_medido}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rango Esperado:</span>
                      <span className="font-medium text-green-600">{fallaDetalle.valor_esperado}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Desviación:</span>
                      <span className="font-medium text-orange-600">-5°C fuera de rango</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha - Descripción y acciones */}
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Descripción Detallada</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {fallaDetalle.descripcion}
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Acciones Recomendadas</h3>
                  <p className="text-gray-700 leading-relaxed">
                    {fallaDetalle.acciones_recomendadas}
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800 mb-2">Impacto en el Plasma</h3>
                  <ul className="text-gray-700 list-disc list-inside space-y-1">
                    <li>Posible degradación de factores de coagulación</li>
                    <li>Reducción del tiempo de vida útil</li>
                    <li>Riesgo de contaminación bacteriana aumentado</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Información Técnica Adicional</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">ID de Evento:</span>
                  <p className="font-medium">EVT-{fallaDetalle.id.toString().padStart(4, '0')}</p>
                </div>
                <div>
                  <span className="text-gray-600">Prioridad:</span>
                  <p className="font-medium text-red-600">Alta</p>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <p className="font-medium text-orange-600">Pendiente</p>
                </div>
                <div>
                  <span className="text-gray-600">Reportado por:</span>
                  <p className="font-medium">Sistema Automático</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-4 pt-6 border-t border-gray-200">
              <button
                onClick={() => navigate(`/operador/reportar/${fallaDetalle.id}`)}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition font-medium"
              >
                📋 Reportar esta Falla
              </button>
              <button
                onClick={() => navigate('/operador/dashboard')}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition font-medium"
              >
                ← Volver al Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetallesFalla;