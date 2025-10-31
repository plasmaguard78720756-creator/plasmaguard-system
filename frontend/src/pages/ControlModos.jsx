import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { controlService, sensorService } from '../services/api';

const ControlModos = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [modoOperacion, setModoOperacion] = useState('auto');
  const [datosSimulacion, setDatosSimulacion] = useState({
    temperatura: -25.0,
    humedad: 45.0,
    voltaje: 220.0,
    corriente: 2.0
  });
  const [controlManual, setControlManual] = useState({
    focoNormal: false,
    focoAlerta: false
  });
  const [datosReales, setDatosReales] = useState({
    temperatura: 0,
    humedad: 0,
    voltaje: 0,
    corriente: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargandoEstado, setCargandoEstado] = useState(true);

  useEffect(() => {
    cargarEstadoSistema();
    const interval = setInterval(cargarDatosReales, 5000);
    return () => clearInterval(interval);
  }, []);

  const cargarEstadoSistema = async () => {
    try {
      setCargandoEstado(true);
      const [controlResponse, sensoresResponse] = await Promise.all([
        controlService.getControlStatus(),
        sensorService.getLatestData()
      ]);

      setModoOperacion(controlResponse.operation_mode);
      
      setDatosSimulacion({
        temperatura: controlResponse.simulated_temperature || -25.0,
        humedad: controlResponse.simulated_humidity || 45.0,
        voltaje: controlResponse.simulated_voltage || 220.0,
        corriente: controlResponse.simulated_current || 2.0
      });

      setControlManual({
        focoNormal: controlResponse.manual_light1 || false,
        focoAlerta: controlResponse.manual_light2 || false
      });

      if (sensoresResponse.data && !sensoresResponse.empty) {
        setDatosReales({
          temperatura: sensoresResponse.data.temperature,
          humedad: sensoresResponse.data.humidity,
          voltaje: sensoresResponse.data.voltage,
          corriente: sensoresResponse.data.current
        });
      }

    } catch (error) {
      console.error('Error cargando estado del sistema:', error);
      setMensaje('❌ Error al cargar el estado del sistema');
    } finally {
      setCargandoEstado(false);
    }
  };

  const cargarDatosReales = async () => {
    try {
      const response = await sensorService.getLatestData();
      if (response.data && !response.empty) {
        setDatosReales({
          temperatura: response.data.temperature,
          humedad: response.data.humidity,
          voltaje: response.data.voltage,
          corriente: response.data.current
        });
      }
    } catch (error) {
      console.error('Error cargando datos reales:', error);
    }
  };

  const handleCambiarModo = async (nuevoModo) => {
    try {
      setIsLoading(true);
      setMensaje('');
      
      const response = await controlService.updateOperationMode({
        operation_mode: nuevoModo,
        user_id: user?.id
      });

      if (response.success) {
        setModoOperacion(nuevoModo);
        setMensaje(`✅ ${response.message}`);
        
        if (nuevoModo === 'auto') {
          setControlManual({ focoNormal: false, focoAlerta: false });
        }
      } else {
        setMensaje('❌ Error al cambiar el modo de operación');
      }
      
    } catch (error) {
      console.error('Error cambiando modo:', error);
      setMensaje('❌ Error al cambiar el modo de operación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleControlManual = async (foco, estado) => {
    if (modoOperacion !== 'manual') {
      setMensaje('⚠️ Solo se pueden controlar focos en modo manual');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const nuevoControl = {
        ...controlManual,
        [foco]: estado
      };

      const response = await controlService.controlManualLights({
        manual_light1: nuevoControl.focoNormal,
        manual_light2: nuevoControl.focoAlerta,
        user_id: user?.id
      });

      if (response.success) {
        setControlManual(nuevoControl);
        setMensaje(`💡 ${response.message}`);
      } else {
        setMensaje('❌ Error al controlar focos');
      }

    } catch (error) {
      console.error('Error controlando focos:', error);
      setMensaje('❌ Error al controlar focos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCambiarSimulacion = (campo, valor) => {
    if (modoOperacion !== 'simulation') {
      setMensaje('⚠️ Solo se pueden modificar datos en modo simulación');
      return;
    }
    
    setDatosSimulacion(prev => ({
      ...prev,
      [campo]: parseFloat(valor) || 0
    }));
  };

  const handleAplicarSimulacion = async () => {
    try {
      setIsLoading(true);
      
      const response = await controlService.setSimulationData({
        simulated_temperature: datosSimulacion.temperatura,
        simulated_humidity: datosSimulacion.humedad,
        simulated_voltage: datosSimulacion.voltaje,
        simulated_current: datosSimulacion.corriente,
        user_id: user?.id
      });

      if (response.success) {
        setMensaje(`✅ ${response.message}`);
      } else {
        setMensaje('❌ Error al aplicar datos de simulación');
      }
      
    } catch (error) {
      console.error('Error aplicando simulación:', error);
      setMensaje('❌ Error al aplicar datos de simulación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVolver = () => {
    if (modoOperacion !== 'auto') {
      handleCambiarModo('auto');
    }
    navigate('/tecnico/dashboard');
  };

  const getModoTexto = (modo) => {
    const modos = {
      auto: 'Automático',
      manual: 'Manual',
      simulation: 'Simulación'
    };
    return modos[modo] || modo;
  };

  const getModoColor = (modo) => {
    const colores = {
      auto: 'bg-green-100 text-green-800',
      manual: 'bg-blue-100 text-blue-800',
      simulation: 'bg-purple-100 text-purple-800'
    };
    return colores[modo] || 'bg-gray-100 text-gray-800';
  };

  if (cargandoEstado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plasma-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando configuración del sistema...</p>
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
              <p className="text-gray-600">Acceso: Servicio Técnico - Control de Modos</p>
            </div>
            <button
              onClick={handleVolver}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Mensaje de estado */}
        {mensaje && (
          <div className={`p-4 rounded-lg mb-6 animate-fade-in ${
            mensaje.includes('✅') ? 'bg-green-100 border border-green-300 text-green-700' :
            mensaje.includes('❌') ? 'bg-red-100 border border-red-300 text-red-700' :
            'bg-yellow-100 border border-yellow-300 text-yellow-700'
          }`}>
            <p className="text-center font-medium">{mensaje}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* COLUMNA IZQUIERDA - Selección de Modo */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">🎛️ Modo de Operación</h2>
              
              <div className="space-y-4">
                {/* Modo Actual */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Modo actual:</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getModoColor(modoOperacion)}`}>
                      {getModoTexto(modoOperacion)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {isLoading ? '🔄 Actualizando...' : '✅ Conectado'}
                    </span>
                  </div>
                </div>

                {/* Selector de Modos */}
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleCambiarModo('auto')}
                    disabled={isLoading || modoOperacion === 'auto'}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      modoOperacion === 'auto' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Modo Automático</p>
                        <p className="text-sm text-gray-600">Sistema controlado automáticamente por sensores</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCambiarModo('manual')}
                    disabled={isLoading || modoOperacion === 'manual'}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      modoOperacion === 'manual' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Modo Manual</p>
                        <p className="text-sm text-gray-600">Control manual de focos indicadores</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleCambiarModo('simulation')}
                    disabled={isLoading || modoOperacion === 'simulation'}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      modoOperacion === 'simulation' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-300 hover:border-purple-500 hover:bg-purple-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <div>
                        <p className="font-semibold text-gray-800">Modo Simulación</p>
                        <p className="text-sm text-gray-600">Pruebas con datos simulados</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Control Manual - Solo visible en modo manual */}
            {modoOperacion === 'manual' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">💡 Control Manual de Focos</h2>
                
                <div className="space-y-4">
                  {/* Foco Normal */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">Foco Normal</p>
                      <p className="text-sm text-gray-600">Indicador de estado normal</p>
                    </div>
                    <button
                      onClick={() => handleControlManual('focoNormal', !controlManual.focoNormal)}
                      disabled={isLoading}
                      className={`w-12 h-6 rounded-full transition ${
                        controlManual.focoNormal ? 'bg-green-500' : 'bg-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transform transition ${
                        controlManual.focoNormal ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>

                  {/* Foco Alerta */}
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">Foco Alerta</p>
                      <p className="text-sm text-gray-600">Indicador de estado de alerta</p>
                    </div>
                    <button
                      onClick={() => handleControlManual('focoAlerta', !controlManual.focoAlerta)}
                      disabled={isLoading}
                      className={`w-12 h-6 rounded-full transition ${
                        controlManual.focoAlerta ? 'bg-red-500' : 'bg-gray-300'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transform transition ${
                        controlManual.focoAlerta ? 'translate-x-7' : 'translate-x-1'
                      }`}></div>
                    </button>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>💡 Nota:</strong> En modo manual, los focos se controlan manualmente y 
                    el sistema automático está desactivado. El ESP32 consultará cada 5 segundos el estado.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA - Simulación y Estado */}
          <div className="space-y-6">
            {/* Modo Simulación - Solo visible en modo simulación */}
            {modoOperacion === 'simulation' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🧪 Datos de Simulación</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperatura (°C)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={datosSimulacion.temperatura}
                      onChange={(e) => handleCambiarSimulacion('temperatura', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Humedad (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={datosSimulacion.humedad}
                      onChange={(e) => handleCambiarSimulacion('humedad', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Voltaje (V)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={datosSimulacion.voltaje}
                      onChange={(e) => handleCambiarSimulacion('voltaje', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Corriente (A)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={datosSimulacion.corriente}
                      onChange={(e) => handleCambiarSimulacion('corriente', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <button
                    onClick={handleAplicarSimulacion}
                    disabled={isLoading}
                    className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition font-medium disabled:bg-purple-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? '🔄 Aplicando...' : '🚀 Aplicar Datos de Simulación'}
                  </button>
                </div>

                <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    <strong>🧪 Nota:</strong> En modo simulación, el sistema usa datos simulados 
                    para pruebas y los sensores reales están desactivados. El ESP32 usará estos datos.
                  </p>
                </div>
              </div>
            )}

            {/* Información del Sistema */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Información del Sistema</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Usuario:</span>
                  <span className="font-medium">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modo actual:</span>
                  <span className={`font-medium ${getModoColor(modoOperacion)} px-2 py-1 rounded`}>
                    {getModoTexto(modoOperacion)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Datos temperatura:</span>
                  <span className="font-medium">{datosReales.temperatura}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Datos voltaje:</span>
                  <span className="font-medium">{datosReales.voltaje}V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Última actualización:</span>
                  <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado conexión:</span>
                  <span className="font-medium text-green-600">Conectado</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  <strong>⚠️ Seguridad:</strong> Al salir de esta ventana, el sistema volverá 
                  automáticamente al modo automático por seguridad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlModos;