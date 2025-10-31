import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sensorService, alertService } from '../services/api';

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
        threshold: alerta.threshold
      }));
      setFallas(fallasFromAlerts);
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
      case 'optimal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
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
      ? <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Crítica</span>
      : <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">Advertencia</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plasma-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos del sistema...</p>
        </div>
      </div>
    );
  }

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
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          {/* Estado del Plasma */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Estado del Plasma Fresco Congelado
            </h2>
            <div className="flex items-center space-x-4">
              <div className={`w-6 h-6 rounded-full ${getStatusColor()} animate-pulse`}></div>
              <div>
                <p className={`font-semibold ${
                  plasmaStatus === 'critical' ? 'text-red-600' :
                  plasmaStatus === 'warning' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {getStatusMessage()}
                </p>
                <p className="text-sm text-gray-600">
                  Última actualización: {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>

          {/* Registro de Fallas Dropdown */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Registro de Fallas
            </h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary"
            >
              <option value="1h">Última hora</option>
              <option value="3h">Últimas 3 horas</option>
              <option value="6h">Últimas 6 horas</option>
              <option value="12h">Últimas 12 horas</option>
            </select>
            <p className="text-sm text-gray-600 mt-2">
              Mostrando fallas del período seleccionado
            </p>
          </div>

          {/* Información adicional */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Resumen del Sistema
            </h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-semibold">Total de fallas:</span> {fallas.length}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Críticas:</span> {fallas.filter(f => f.severidad === 'critical').length}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Advertencias:</span> {fallas.filter(f => f.severidad === 'warning').length}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Temperatura actual:</span> {datosSensores.temperatura}°C
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Fallas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Lista de Fallas - Últimas {selectedPeriod}
            </h2>
            <button
              onClick={cargarDatosIniciales}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              🔄 Actualizar
            </button>
          </div>
          
          {fallas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No hay fallas registradas en este período</p>
              <p className="text-gray-400 text-sm">El sistema está funcionando correctamente</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fallas.map((falla) => (
                <div key={falla.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">{falla.tipo}</h3>
                      <p className="text-gray-600 text-sm">{falla.descripcion}</p>
                      <p className="text-gray-500 text-xs mt-1">{falla.fecha}</p>
                      <p className="text-gray-600 text-sm mt-1">
                        Valor: <span className="font-medium">{falla.valor}</span> | 
                        Umbral: <span className="font-medium">{falla.threshold}</span>
                      </p>
                    </div>
                    {getSeveridadBadge(falla.severidad)}
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleVerFalla(falla.id)}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
                    >
                      Ver
                    </button>
                    <button
                      onClick={() => handleReportarFalla(falla.id)}
                      className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
                    >
                      Reportar
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
    </div>
  );
};

export default DashboardOperador;