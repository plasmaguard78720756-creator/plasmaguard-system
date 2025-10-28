// src/pages/Login.jsx - VERSIÓN COMPLETA
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { testBackendConnection } from '../services/testConnection';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeMenu, setActiveMenu] = useState(null);
  const [loginData, setLoginData] = useState({
    userId: '',
    password: ''
  });
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');

  // Datos del menú desplegable
  const menuOptions = {
    plasma: {
      title: "Plasma Fresco Congelado",
      content: "El plasma fresco congelado debe mantenerse entre -25°C y -35°C para preservar sus factores de coagulación. Nuestro sistema monitorea constantemente estas condiciones críticas.",
      image: "🩸"
    },
    dispositivo: {
      title: "Información del Dispositivo",
      content: "Sistema de monitoreo con sensores de temperatura PT100, humedad DHT11, voltaje ZMPT101B y corriente ACS712. Comunicación WiFi con ESP32.",
      image: "❄️"
    },
    mision: {
      title: "Misión",
      content: "Garantizar la integridad del plasma fresco congelado mediante monitoreo continuo y alertas inmediatas, asegurando su calidad para transfusiones.",
      image: "🎯"
    },
    vision: {
      title: "Visión",
      content: "Ser el sistema de referencia en monitoreo de plasma a nivel nacional, implementando tecnología IoT para la seguridad de productos sanguíneos.",
      image: "👁️"
    }
  };

  const handleMenuClick = (option) => {
    setActiveMenu(activeMenu === option ? null : option);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
  
    console.log('🔍 Iniciando login...', loginData); // ← AGREGAR
  
    // Validaciones básicas
    if (!loginData.userId.trim() || !loginData.password.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= 3) {
      setError('Demasiados intentos fallidos. Por favor contacte al administrador.');
      return;
    }

    try {
      // Llamada real al backend
      const credentials = {
        email: loginData.userId,
        password: loginData.password
      };

      console.log('🔍 Enviando credenciales...', credentials); // ← AGREGAR
    
      const result = await login(credentials);
    
      console.log('🔍 Resultado del login:', result); // ← AGREGAR
    
      if (result.success) {
        console.log('🔍 Usuario autenticado:', result.user); // ← AGREGAR
        console.log('🔍 Rol del usuario:', result.user.role); // ← AGREGAR
      
        // Redirigir según el rol del usuario
        switch (result.user.role) {
          case 'operador':
            console.log('🔍 Redirigiendo a operador dashboard');
            navigate('/operador/dashboard');
            break;
          case 'admin':
            console.log('🔍 Redirigiendo a verificación admin');
            navigate('/admin/verificar', { 
              state: { user: result.user } 
            });
            break;
          case 'servicio':
            console.log('🔍 Redirigiendo a verificación servicio');
            navigate('/tecnico/verificar', { 
              state: { user: result.user } 
            });
            break;
          default:
            console.log('🔍 Rol desconocido, redirigiendo a home');
            navigate('/');
        }
      } else {
        console.log('🔍 Error en login:', result.error); // ← AGREGAR
        setError(result.error);
        setLoginData({
          userId: '',
          password: ''
        });
      }
    } catch (error) {
      console.log('🔍 Error de conexión:', error); // ← AGREGAR
      setError('Error de conexión con el servidor');
      setLoginData({
        userId: '',
        password: ''
      });
    }
  };

  const handleCreateAccount = () => {
    navigate('/register');
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
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
        
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="md:flex min-h-[600px]">
            {/* Lado izquierdo - Menú desplegable */}
            <div className="md:w-1/2 p-8 bg-gray-50 border-r border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Información del Sistema
              </h2>
              
              {/* Menú de opciones */}
              <div className="space-y-3 mb-6">
                {Object.entries(menuOptions).map(([key, option]) => (
                  <div key={key} className="border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => handleMenuClick(key)}
                      className="w-full px-4 py-3 bg-white hover:bg-gray-100 text-left font-medium text-gray-700 flex items-center justify-between transition duration-200"
                    >
                      <span className="flex items-center">
                        <span className="text-xl mr-3">{option.image}</span>
                        {option.title}
                      </span>
                      <span className={`transform transition duration-200 ${
                        activeMenu === key ? 'rotate-180' : 'rotate-0'
                      }`}>
                        ▼
                      </span>
                    </button>
                    
                    {/* Contenido desplegable */}
                    {activeMenu === key && (
                      <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 animate-slide-in">
                        <p className="text-gray-700 leading-relaxed">
                          {option.content}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Información adicional cuando no hay menú seleccionado */}
              {!activeMenu && (
                <div className="bg-blue-100 border border-blue-200 rounded-lg p-4 mt-6">
                  <p className="text-blue-800 text-sm">
                    <strong>💡 Tip:</strong> Selecciona una opción del menú para conocer más sobre nuestro sistema de monitoreo de plasma.
                  </p>
                </div>
              )}
            </div>
            
            {/* Lado derecho - Formulario login */}
            <div className="md:w-1/2 p-8 flex flex-col">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Iniciar Sesión
              </h2>
              
              {/* Mensaje de error */}
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg animate-fade-in">
                  {error}
                  {attempts > 0 && (
                    <div className="text-sm mt-1">
                      Intentos restantes: {3 - attempts}
                    </div>
                  )}
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={handleLogin} className="space-y-6 flex-grow">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID de Usuario
                  </label>
                  <input
                    type="text"
                    name="userId"
                    value={loginData.userId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary focus:border-transparent transition duration-200"
                    placeholder="Ingresa tu ID (CI registrado)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary focus:border-transparent transition duration-200"
                    placeholder="Ingresa tu contraseña"
                  />
                </div>

                <div className="space-y-4 pt-4">
                  
                  <button 
                   type="button"
                   onClick={() => {
                    console.log('🔍 Probando redirección manual a admin...');
                   navigate('/admin/verificar', { 
                       state: { user: { name: 'Admin Test', role: 'admin' } } 
                    });
                   }}
                   className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition mb-2"
                  >
                  🔧 Probar Redirección Admin (Temporal)
                  </button>

                  <button 
                  type="button"
                   onClick={async () => {
                    const result = await testBackendConnection();
                   alert(result.success ? '✅ Conexión exitosa' : '❌ Error: ' + result.error);
                   }}
                   className="w-full bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 transition mb-2"
                  >
                  🔧 Probar Conexión Backend
                  </button>

                  <button 
                    type="submit"
                    className="w-full bg-plasma-primary text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium shadow-md hover:shadow-lg"
                  >
                    Ingresar
                  </button>
                  
                  <button 
                    type="button"
                    onClick={handleCreateAccount}
                    className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition duration-200 font-medium"
                  >
                    Crear Cuenta Nueva
                  </button>
                </div>
              </form>

              {/* Botón de recarga */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <button 
                  onClick={handleReload}
                  className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-200 transition duration-200 text-sm flex items-center justify-center"
                >
                  <span className="mr-2">🔄</span>
                  Recargar Página
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;