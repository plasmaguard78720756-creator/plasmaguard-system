// src/pages/VerificacionAdmin.jsx - VERSIÓN COMPLETA
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const VerificacionAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [codigo, setCodigo] = useState('');
  const [intentos, setIntentos] = useState(0);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Obtener datos del usuario de la navegación o del contexto
  const userData = location.state?.user || user;

  const handleVerification = async (e) => {
    e.preventDefault();
    
    if (!codigo.trim()) {
      setError('Por favor ingresa el código de verificación');
      return;
    }

    setIsVerifying(true);
    setError('');

    // Simular verificación (luego será con backend)
    setTimeout(() => {
      const nuevoIntento = intentos + 1;
      setIntentos(nuevoIntento);

      if (codigo === 'PlasmaGuard1230') {
        // Código correcto - redirigir al dashboard admin
        navigate('/admin/dashboard', { 
          state: { user: userData, verified: true }
        });
      } else {
        // Código incorrecto
        if (nuevoIntento >= 3) {
          setError('❌ Demasiados intentos fallidos. No puedes ingresar a este espacio.');
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setError(`❌ Código incorrecto. Intentos restantes: ${3 - nuevoIntento}`);
          setCodigo(''); // Limpiar campo
        }
      }
      
      setIsVerifying(false);
    }, 1500);
  };

  const handleVolver = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-plasma-primary">PLASMAGUARD</h1>
          <p className="text-gray-600 mt-2">Seguridad y Confianza</p>
        </div>

        {/* Tarjeta de verificación */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Información del usuario */}
          {userData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <span className="text-blue-600 text-lg">👨‍💼</span>
                </div>
                <div>
                  <p className="font-semibold text-blue-800">{userData.name}</p>
                  <p className="text-blue-600 text-sm">Acceso: Administrador</p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje principal */}
          <div className="text-center mb-6">
            <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4 mb-4">
              <span className="text-yellow-600 text-lg">⚠️</span>
              <h2 className="text-xl font-bold text-yellow-800 mt-2">
                Verificación Requerida
              </h2>
              <p className="text-yellow-700 mt-1">
                Usted está intentando ingresar como administrador
              </p>
            </div>
          </div>

          {/* Contador de intentos */}
          {intentos > 0 && (
            <div className="bg-gray-100 border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-center text-gray-700 text-sm">
                Intentos realizados: <span className="font-semibold">{intentos}/3</span>
              </p>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className={`p-4 rounded-lg mb-4 animate-fade-in ${
              error.includes('Demasiados') ? 'bg-red-100 border border-red-300 text-red-700' : 
              'bg-orange-100 border border-orange-300 text-orange-700'
            }`}>
              <p className="text-center font-medium">{error}</p>
              {error.includes('Demasiados') && (
                <p className="text-center text-sm mt-1">
                  Redirigiendo al login...
                </p>
              )}
            </div>
          )}

          {/* Formulario de verificación */}
          <form onSubmit={handleVerification} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código de Verificación *
              </label>
              <input
                type="password"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                disabled={intentos >= 3 || isVerifying}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Ingresa el código de administrador"
                autoComplete="off"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este código es requerido para acceder al panel de administración
              </p>
            </div>

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={intentos >= 3 || isVerifying || !codigo.trim()}
                className="flex-1 bg-plasma-primary text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verificando...
                  </div>
                ) : (
                  '✅ Verificar'
                )}
              </button>
              
              <button
                type="button"
                onClick={handleVolver}
                disabled={isVerifying}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                ← Volver
              </button>
            </div>
          </form>

          {/* Información de ayuda */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">💡 Información Importante</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Solo personal autorizado puede acceder al panel de administración</li>
              <li>• Después de 3 intentos fallidos, el acceso será bloqueado</li>
              <li>• Contacta al superadministrador si olvidaste el código</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificacionAdmin;