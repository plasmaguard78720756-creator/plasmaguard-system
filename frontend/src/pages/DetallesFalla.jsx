// src/pages/DetallesFalla.jsx - VERSIÓN CON DATOS REALES
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { alertService } from '../services/api';

const DetallesFalla = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  
  const [fallaDetalle, setFallaDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar datos reales de la falla
  useEffect(() => {
    cargarDetallesFalla();
  }, [id]);

  const cargarDetallesFalla = async () => {
    try {
      setLoading(true);
      const response = await alertService.getAllAlerts();
      
      if (response.success) {
        // Buscar la alerta específica por ID
        const alerta = response.data.find(a => a.id === parseInt(id));
        
        if (alerta) {
          setFallaDetalle({
            id: alerta.id,
            tipo: alerta.type,
            descripcion: alerta.message,
            severidad: alerta.severity,
            fecha: new Date(alerta.created_at).toLocaleString(),
            valor_medido: `${alerta.value}${getUnidad(alerta.type)}`,
            valor_esperado: `${alerta.threshold}${getUnidad(alerta.type)}`,
            sensor_afectado: getSensorNombre(alerta.type),
            duracion: 'En revisión', // Podemos calcular esto si tenemos más datos
            acciones_recomendadas: getAccionesRecomendadas(alerta.type, alerta.value)
          });
        } else {
          setError('Falla no encontrada');
        }
      } else {
        setError('Error al cargar los detalles de la falla');
      }
    } catch (error) {
      console.error('Error cargando falla:', error);
      setError('Error de conexión al cargar la falla');
    } finally {
      setLoading(false);
    }
  };

  // Funciones auxiliares
  const getUnidad = (tipo) => {
    const unidades = {
      temperature: '°C',
      humidity: '%',
      voltage: 'V',
      current: 'A'
    };
    return unidades[tipo] || '';
  };

  const getSensorNombre = (tipo) => {
    const sensores = {
      temperature: 'PT100 (Temperatura)',
      humidity: 'DHT11 (Humedad)',
      voltage: 'ZMPT101B (Voltaje)',
      current: 'ACS712 (Corriente)',
      system: 'Sistema General'
    };
    return sensores[tipo] || tipo;
  };

  const getAccionesRecomendadas = (tipo, valor) => {
    const acciones = {
      temperature: `Verificar sensor PT100 y ajustar temperatura del refrigerador. Valor crítico: ${valor}°C`,
      humidity: `Verificar sistema de control de humedad. Valor actual: ${valor}%`,
      voltage: `Revisar fuente de alimentación y estabilizador. Voltaje: ${valor}V`,
      current: `Verificar consumo eléctrico del sistema. Corriente: ${valor}A`,
      system: 'Revisión general del sistema requerida'
    };
    return acciones[tipo] || 'Contactar al servicio técnico para diagnóstico.';
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plasma-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando detalles de la falla...</p>
        </div>
      </div>
    );
  }

  if (error || !fallaDetalle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">❌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Falla no encontrada'}</p>
            <button
              onClick={() => navigate('/operador/dashboard')}
              className="bg-plasma-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-4 mb-3">
            <img src="/favicon-32x32.png" alt="Logo" className="w-10 h-10" />
            <h1 className="text-4xl font-bold text-plasma-primary">
              PLASMA<span className="text-red-600">GUARD</span>
            </h1>
          </div>
          <p className="text-gray-600">Sistema de Monitoreo de Plasma</p>
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
                      <span className="text-gray-600">Umbral Esperado:</span>
                      <span className="font-medium text-green-600">{fallaDetalle.valor_esperado}</span>
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
                  <p className={`font-medium ${
                    fallaDetalle.severidad === 'critical' ? 'text-red-600' : 'text-orange-600'
                  }`}>
                    {fallaDetalle.severidad === 'critical' ? 'Alta' : 'Media'}
                  </p>
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