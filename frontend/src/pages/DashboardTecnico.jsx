// src/pages/DashboardTecnico.jsx - VERSIÓN CON DATOS REALES
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { sensorService, alertService } from '../services/api';

const DashboardTecnico = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [reportes, setReportes] = useState([]);
  const [datosSensores, setDatosSensores] = useState({
    temperatura: 0,
    humedad: 0,
    voltaje: 0,
    corriente: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatosIniciales();
    const interval = setInterval(cargarDatosSensores, 5000); // Actualizar cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      await Promise.all([
        cargarDatosSensores(),
        cargarAlertasActivas()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar datos del sistema');
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
      }
    } catch (error) {
      console.error('Error cargando datos de sensores:', error);
    }
  };

  const cargarAlertasActivas = async () => {
    try {
      const response = await alertService.getActiveAlerts();
      // Convertir alertas a formato de reportes
      const reportesFromAlerts = response.data.map(alerta => ({
        id: alerta.id,
        operador: 'Sistema Automático',
        falla: `${alerta.type.toUpperCase()}: ${alerta.message}`,
        fecha: new Date(alerta.created_at).toLocaleString(),
        observaciones: `Valor: ${alerta.value} | Umbral: ${alerta.threshold}`,
        estado: 'pendiente',
        severidad: alerta.severity
      }));
      setReportes(reportesFromAlerts);
    } catch (error) {
      console.error('Error cargando alertas:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleVerReporte = (reporteId) => {
    alert(`Viendo detalles del reporte #${reporteId}`);
  };

  const handleSolucionarReporte = async (reporteId) => {
    try {
      await alertService.acknowledgeAlert(reporteId);
      setReportes(reportes.filter(reporte => reporte.id !== reporteId));
      alert(`✅ Reporte #${reporteId} marcado como solucionado`);
    } catch (error) {
      alert('❌ Error al solucionar el reporte');
    }
  };

  const handleEliminarReporte = (reporteId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este reporte?')) {
      setReportes(reportes.filter(reporte => reporte.id !== reporteId));
    }
  };

  const getEstadoBadge = (estado) => {
    const config = {
      pendiente: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      en_revision: { color: 'bg-blue-100 text-blue-800', label: 'En Revisión' },
      solucionado: { color: 'bg-green-100 text-green-800', label: 'Solucionado' }
    };
    
    const estadoConfig = config[estado] || { color: 'bg-gray-100 text-gray-800', label: estado };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${estadoConfig.color}`}>
        {estadoConfig.label}
      </span>
    );
  };

  const getSensorStatus = (valor, min, max) => {
    if (valor < min || valor > max) return 'critical';
    if (Math.abs(valor - (min + max) / 2) > (max - min) * 0.2) return 'warning';
    return 'optimal';
  };

  const getSensorColor = (valor, min, max) => {
    const status = getSensorStatus(parseFloat(valor), min, max);
    return status === 'critical' ? 'text-red-600' : 
           status === 'warning' ? 'text-yellow-600' : 'text-green-600';
  };

  const getSensorIndicator = (valor, min, max) => {
    const status = getSensorStatus(parseFloat(valor), min, max);
    return (
      <div className={`w-3 h-3 rounded-full ${
        status === 'critical' ? 'bg-red-500 animate-pulse' :
        status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
      }`}></div>
    );
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
                Bienvenido: <span className="text-plasma-primary">{user?.name || 'Técnico'}</span>
              </p>
              <p className="text-gray-600">Acceso: Servicio Técnico</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate('/tecnico/control')}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                🎛️ Control de Modos
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA - Reportes */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📋 Reportes de Fallas</h2>
                <button
                  onClick={cargarDatosIniciales}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  🔄 Actualizar
                </button>
              </div>
              
              {reportes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No hay reportes pendientes</p>
                  <p className="text-gray-400 text-sm">El sistema está funcionando correctamente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reportes.map((reporte) => (
                    <div key={reporte.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-gray-800">Reporte #{reporte.id}</h3>
                            {getEstadoBadge(reporte.estado)}
                            {reporte.severidad === 'critical' && (
                              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                                CRÍTICO
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-1">
                            <strong>Reportado por:</strong> {reporte.operador}
                          </p>
                          <p className="text-gray-700 mb-1">
                            <strong>Falla:</strong> {reporte.falla}
                          </p>
                          <p className="text-gray-600 text-sm mb-2">
                            <strong>Fecha:</strong> {reporte.fecha}
                          </p>
                          <p className="text-gray-700 bg-gray-50 p-2 rounded text-sm">
                            {reporte.observaciones}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVerReporte(reporte.id)}
                          className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition text-sm"
                        >
                          👁️ Ver
                        </button>
                        <button
                          onClick={() => handleSolucionarReporte(reporte.id)}
                          disabled={reporte.estado === 'solucionado'}
                          className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition text-sm disabled:bg-green-300 disabled:cursor-not-allowed"
                        >
                          ✅ Solucionar
                        </button>
                        <button
                          onClick={() => handleEliminarReporte(reporte.id)}
                          className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition text-sm"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA - Monitoreo de Sensores */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Monitoreo en Tiempo Real</h2>
              
              <div className="space-y-4">
                {/* Temperatura */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getSensorIndicator(datosSensores.temperatura, -35, -25)}
                    <div>
                      <p className="font-medium text-gray-700">Temperatura</p>
                      <p className="text-xs text-gray-500">Rango: -35°C a -25°C</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${getSensorColor(datosSensores.temperatura, -35, -25)}`}>
                    {datosSensores.temperatura}°C
                  </span>
                </div>

                {/* Humedad */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getSensorIndicator(datosSensores.humedad, 30, 70)}
                    <div>
                      <p className="font-medium text-gray-700">Humedad</p>
                      <p className="text-xs text-gray-500">Rango: 30% a 70%</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${getSensorColor(datosSensores.humedad, 30, 70)}`}>
                    {datosSensores.humedad}%
                  </span>
                </div>

                {/* Voltaje */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getSensorIndicator(datosSensores.voltaje, 200, 240)}
                    <div>
                      <p className="font-medium text-gray-700">Voltaje</p>
                      <p className="text-xs text-gray-500">Rango: 200V a 240V</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${getSensorColor(datosSensores.voltaje, 200, 240)}`}>
                    {datosSensores.voltaje}V
                  </span>
                </div>

                {/* Corriente */}
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getSensorIndicator(datosSensores.corriente, 0, 15)}
                    <div>
                      <p className="font-medium text-gray-700">Corriente</p>
                      <p className="text-xs text-gray-500">Máx: 15A</p>
                    </div>
                  </div>
                  <span className={`text-lg font-bold ${getSensorColor(datosSensores.corriente, 0, 15)}`}>
                    {datosSensores.corriente}A
                  </span>
                </div>
              </div>

              {/* Estado general */}
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Actualizado:</strong> {new Date().toLocaleTimeString()}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Estado general:</strong> 
                  <span className="text-green-600 font-medium"> Sistema estable</span>
                </p>
              </div>
            </div>

            {/* Información rápida */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📈 Resumen Rápido</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{reportes.length}</p>
                  <p className="text-blue-700">Total Reportes</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">
                    {reportes.filter(r => r.estado === 'pendiente').length}
                  </p>
                  <p className="text-yellow-700">Pendientes</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {reportes.filter(r => r.estado === 'solucionado').length}
                  </p>
                  <p className="text-green-700">Solucionados</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">4/4</p>
                  <p className="text-gray-700">Sensores OK</p>
                </div>
              </div>
            </div>
          </div>
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

export default DashboardTecnico;