import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sensorService, alertService } from '../services/api';
import ThemeToggle from '../components/ThemeToggle';

const DashboardOperador = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('1h');
  const [plasmaStatus, setPlasmaStatus] = useState('optimal');
  const [fallas, setFallas] = useState([]);
  const [datosSensores, setDatosSensores] = useState({
    temperatura: 0,
    humedad: 0,
    voltaje: 0,
    corriente: 0
  });
  const [loading, setLoading] = useState(true);
  const [alertStats, setAlertStats] = useState({
    total: 0,
    criticas: 0,
    advertencias: 0,
    ultimaAlerta: null
  });

  useEffect(() => {
    cargarDatosIniciales();
    const interval = setInterval(cargarDatosSensores, 5000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      await Promise.all([
        cargarDatosSensores(),
        cargarAlertasActivas()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosSensores = async () => {
    try {
      const response = await sensorService.getLatestData();
      if (response.data && !response.empty) {
        setDatosSensores({
          temperatura: response.data.temperature,
          humedad: response.data.humidity,
          voltaje: response.data.voltage,
          corriente: response.data.current
        });
        
        actualizarEstadoPlasma(response.data);
      }
    } catch (error) {
      console.error('Error cargando datos de sensores:', error);
    }
  };

  const cargarAlertasActivas = async () => {
    try {
      const response = await alertService.getActiveAlerts();
      const fallasFromAlerts = response.data.map(alerta => ({
        id: alerta.id,
        tipo: alerta.type.charAt(0).toUpperCase() + alerta.type.slice(1),
        descripcion: alerta.message,
        fecha: new Date(alerta.created_at).toLocaleString(),
        severidad: alerta.severity,
        valor: alerta.value,
        threshold: alerta.threshold,
        prioridad: alerta.priority || 3
      }));
      
      // Ordenar por prioridad (críticas primero)
      fallasFromAlerts.sort((a, b) => a.prioridad - b.prioridad);
      
      setFallas(fallasFromAlerts);
      
      // Actualizar estadísticas
      const criticas = fallasFromAlerts.filter(f => f.severidad === 'critical').length;
      const advertencias = fallasFromAlerts.filter(f => f.severidad === 'warning').length;
      const ultimaAlerta = fallasFromAlerts.length > 0 ? fallasFromAlerts[0].fecha : null;
      
      setAlertStats({
        total: fallasFromAlerts.length,
        criticas,
        advertencias,
        ultimaAlerta
      });
      
    } catch (error) {
      console.error('Error cargando alertas:', error);
    }
  };

  const actualizarEstadoPlasma = (datos) => {
    const tempCritica = datos.temperature < -35 || datos.temperature > -25;
    const voltajeCritico = datos.voltage < 200 || datos.voltage > 240;
    const humedadCritica = datos.humidity > 70;

    if (tempCritica || voltajeCritico) {
      setPlasmaStatus('critical');
    } else if (humedadCritica) {
      setPlasmaStatus('warning');
    } else {
      setPlasmaStatus('optimal');
    }
  };

  const handleVerFalla = (fallaId) => {
    navigate(`/operador/falla/${fallaId}`);
  };

  const handleReportarFalla = (fallaId) => {
    navigate(`/operador/reportar/${fallaId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusColor = () => {
    switch (plasmaStatus) {
      case 'optimal': return 'bg-theme-success';
      case 'warning': return 'bg-theme-warning';
      case 'critical': return 'bg-theme-secondary';
      default: return 'bg-gray-500';
    }
  };

  const getStatusMessage = () => {
    switch (plasmaStatus) {
      case 'optimal': return 'Todo funcionando correctamente';
      case 'warning': return 'Fallas menores detectadas';
      case 'critical': return 'Fallas críticas - Atención inmediata';
      default: return 'Estado desconocido';
    }
  };

  const getSeveridadBadge = (severidad) => {
    return severidad === 'critical' 
      ? <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium animate-pulse">CRÍTICA</span>
      : <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">ADVERTENCIA</span>;
  };

  const getPrioridadIcono = (prioridad) => {
    switch (prioridad) {
      case 1: return '🔴'; // Crítica
      case 2: return '🟡'; // Advertencia
      default: return '⚪'; // Informativa
    }
  };

  const getPeriodoTexto = (periodo) => {
    const periodos = {
      '1h': '1 hora',
      '3h': '3 horas',
      '6h': '6 horas',
      '12h': '12 horas'
    };
    return periodos[periodo] || periodo;
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-gradient, linear-gradient(to bottom right, #f0f9ff, #e0f2fe))' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto"></div>
            <p className="mt-4 text-theme-muted">Cargando datos del sistema...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-gradient, linear-gradient(to bottom right, #f0f9ff, #e0f2fe))' }}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-theme-primary">PLASMAGUARD</h1>
          <p className="text-theme-muted mt-2">Sistema Inteligente de Monitoreo</p>
        </div>

        {/* Información del usuario */}
        <div className="bg-theme-card rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-theme">
                Bienvenido: <span className="text-theme-primary">{user?.name || 'Usuario'}</span>
              </p>
              <p className="text-theme-muted">Acceso: Operador - Monitoreo en Tiempo Real</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Tarjetas de Estado Rápido */}
        <div className="grid lg:grid-cols-4 gap-4 mb-6">
          {/* Estado Plasma */}
          <div className={`bg-theme-card rounded-xl shadow-lg p-4 border-l-4 ${
            plasmaStatus === 'critical' ? 'border-red-500' :
            plasmaStatus === 'warning' ? 'border-yellow-500' :
            'border-green-500'
          }`}>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-3 ${getStatusColor()} animate-pulse`}></div>
              <div>
                <p className="text-sm font-medium text-theme-muted">Estado Plasma</p>
                <p className={`text-lg font-bold ${
                  plasmaStatus === 'critical' ? 'text-red-600' :
                  plasmaStatus === 'warning' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {getStatusMessage()}
                </p>
              </div>
            </div>
          </div>

          {/* Alertas Activas */}
          <div className="bg-theme-card rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-theme-muted">Alertas Activas</p>
                <p className="text-2xl font-bold text-theme">{alertStats.total}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-red-600">{alertStats.criticas} críticas</p>
                <p className="text-xs text-yellow-600">{alertStats.advertencias} advertencias</p>
              </div>
            </div>
          </div>

          {/* Temperatura Actual */}
          <div className="bg-theme-card rounded-xl shadow-lg p-4 border-l-4 border-purple-500">
            <p className="text-sm font-medium text-theme-muted">Temperatura Actual</p>
            <p className={`text-2xl font-bold ${
              datosSensores.temperatura < -35 || datosSensores.temperatura > -25 
                ? 'text-red-600' 
                : 'text-theme'
            }`}>
              {datosSensores.temperatura}°C
            </p>
            <p className="text-xs text-theme-muted">Óptimo: -25°C a -35°C</p>
          </div>

          {/* Última Actualización */}
          <div className="bg-theme-card rounded-xl shadow-lg p-4 border-l-4 border-gray-500">
            <p className="text-sm font-medium text-theme-muted">Última Actualización</p>
            <p className="text-lg font-bold text-theme">{new Date().toLocaleTimeString()}</p>
            <p className="text-xs text-theme-muted">Sistema en línea</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Filtro de Período */}
          <div className="bg-theme-card rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-theme mb-4">
              📊 Filtro de Período
            </h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary text-theme"
            >
              <option value="1h">Última hora</option>
              <option value="3h">Últimas 3 horas</option>
              <option value="6h">Últimas 6 horas</option>
              <option value="12h">Últimas 12 horas</option>
            </select>
            <p className="text-sm text-theme-muted mt-2">
              Mostrando alertas de las últimas {getPeriodoTexto(selectedPeriod)}
            </p>
            
            {/* Estadísticas rápidas */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-theme-muted">Resumen del período:</p>
              <div className="flex justify-between mt-2">
                <span className="text-xs text-red-600">🔴 {alertStats.criticas} críticas</span>
                <span className="text-xs text-yellow-600">🟡 {alertStats.advertencias} advertencias</span>
                <span className="text-xs text-theme-muted">Total: {alertStats.total}</span>
              </div>
            </div>
          </div>

          {/* Estado del Sistema */}
          <div className="bg-theme-card rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-theme mb-4">
              🏥 Estado del Plasma
            </h2>
            <div className="flex items-center space-x-4 mb-4">
              <div className={`w-8 h-8 rounded-full ${getStatusColor()} animate-pulse`}></div>
              <div>
                <p className={`text-lg font-semibold ${
                  plasmaStatus === 'critical' ? 'text-red-600' :
                  plasmaStatus === 'warning' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {getStatusMessage()}
                </p>
                <p className="text-sm text-theme-muted">
                  Monitoreo continuo activo
                </p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-muted">Temperatura:</span>
                <span className={`font-medium ${
                  datosSensores.temperatura < -35 || datosSensores.temperatura > -25 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {datosSensores.temperatura}°C
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Humedad:</span>
                <span className={`font-medium ${
                  datosSensores.humedad > 70 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {datosSensores.humedad}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-muted">Voltaje:</span>
                <span className={`font-medium ${
                  datosSensores.voltaje < 200 || datosSensores.voltaje > 240 
                    ? 'text-red-600' 
                    : 'text-green-600'
                }`}>
                  {datosSensores.voltaje}V
                </span>
              </div>
            </div>
          </div>

          {/* Información de Alertas */}
          <div className="bg-theme-card rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-theme mb-4">
              🔔 Sistema de Alertas
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                <span className="text-red-700 text-sm">Alertas Críticas</span>
                <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                  {alertStats.criticas}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                <span className="text-yellow-700 text-sm">Advertencias</span>
                <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
                  {alertStats.advertencias}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                <span className="text-blue-700 text-sm">Total Activas</span>
                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                  {alertStats.total}
                </span>
              </div>
            </div>
            
            {alertStats.ultimaAlerta && (
              <div className="mt-4 p-2 bg-gray-50 rounded text-xs">
                <p className="text-theme-muted">Última alerta:</p>
                <p className="font-medium text-theme">{alertStats.ultimaAlerta}</p>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Alertas Inteligentes */}
        <div className="bg-theme-card rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-theme">
                🚨 Alertas del Sistema - {getPeriodoTexto(selectedPeriod)}
              </h2>
              <p className="text-theme-muted mt-1">
                Sistema inteligente de detección - Alertas agrupadas y priorizadas
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={cargarDatosIniciales}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
              >
                🔄 Actualizar
              </button>
              <button
                onClick={() => setSelectedPeriod('1h')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                ⏰ Ver Recientes
              </button>
            </div>
          </div>
          
          {fallas.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-theme-muted text-lg">No hay alertas activas en este período</p>
              <p className="text-gray-400 text-sm mt-2">El sistema está funcionando correctamente</p>
              <div className="mt-4 p-3 bg-green-50 rounded-lg max-w-md mx-auto">
                <p className="text-green-700 text-sm">
                  <strong>Estado óptimo:</strong> Todos los parámetros dentro de los rangos normales
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {fallas.map((falla) => (
                <div 
                  key={falla.id} 
                  className={`border rounded-lg p-4 hover:shadow-md transition ${
                    falla.severidad === 'critical' 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-yellow-300 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg">{getPrioridadIcono(falla.prioridad)}</span>
                        <h3 className="font-semibold text-theme">{falla.tipo}</h3>
                        {getSeveridadBadge(falla.severidad)}
                      </div>
                      <p className="text-theme-muted text-sm mb-2">{falla.descripcion}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-theme-muted">Valor medido:</span>
                          <p className="font-medium text-red-600">{falla.valor}</p>
                        </div>
                        <div>
                          <span className="text-theme-muted">Umbral:</span>
                          <p className="font-medium text-green-600">{falla.threshold}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-theme-muted">Detectado:</span>
                          <p className="font-medium text-theme">{falla.fecha}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleVerFalla(falla.id)}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                    >
                      📋 Ver Detalles
                    </button>
                    <button
                      onClick={() => handleReportarFalla(falla.id)}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
                    >
                      🚨 Reportar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón Volver */}
        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition"
          >
            Volver al Login
          </button>
        </div>
      </div>
      
      {/* Botón de temas */}
      <ThemeToggle />
    </div>
  );
};

export default DashboardOperador;