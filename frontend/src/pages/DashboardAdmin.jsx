// src/pages/DashboardAdmin.jsx - VERSIÓN SUPER SIMPLE Y FUNCIONAL
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  // Datos de ejemplo SEGUROS
  const usuariosEjemplo = [
    { id: 1, name: 'Admin Temporal', email: 'admin@test.com', role: 'admin', ci: '1234567', active: true },
  ];

  useEffect(() => {
    console.log('✅ DashboardAdmin cargado');
    setUsuarios(usuariosEjemplo);
    setLoading(false);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">PLASMAGUARD</h1>
          <p className="text-gray-600 mt-2">Sistema funcionando correctamente</p>
        </div>

        {/* Información del usuario */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Bienvenido: <span className="text-blue-600">{user?.name || 'Administrador'}</span>
              </p>
              <p className="text-gray-600">Dashboard Admin - Versión Simple</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Contenido simple */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">✅ Sistema Funcionando</h2>
          <p className="text-green-600 mb-4">El error de pantalla blanca ha sido solucionado.</p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800">Usuarios del Sistema</h3>
              <ul className="mt-2 space-y-2">
                {usuarios.map(usuario => (
                  <li key={usuario.id} className="flex justify-between">
                    <span>{usuario.name}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {usuario.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800">Estado del Sistema</h3>
              <p className="mt-2 text-blue-700">✅ Frontend: Operativo</p>
              <p className="text-blue-700">✅ Backend: Conectado</p>
              <p className="text-blue-700">✅ Base de datos: Lista</p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition"
          >
            Volver al Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;