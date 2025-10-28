// src/pages/DashboardAdmin.jsx - VERSIÓN COMPLETA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [usuarios, setUsuarios] = useState([]);
  const [fallas, setFallas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('view'); // 'view', 'edit', 'add'

  // Datos de ejemplo (luego vendrán del backend)
  const usuariosEjemplo = [
    { id: 1, name: 'Juan Pérez', email: 'juan@hospital.com', role: 'operador', ci: '1234567', active: true },
    { id: 2, name: 'María García', email: 'maria@hospital.com', role: 'admin', ci: '7654321', active: true },
    { id: 3, name: 'Carlos López', email: 'carlos@servicio.com', role: 'servicio', ci: '9876543', active: true },
  ];

  const fallasEjemplo = [
    { id: 1, tipo: 'Temperatura', fecha: '2024-01-20 10:30:00', accion: 'Reporte' },
    { id: 2, tipo: 'Humedad', fecha: '2024-01-20 09:15:00', accion: 'Nada' },
    { id: 3, tipo: 'Voltaje', fecha: '2024-01-20 08:45:00', accion: 'Reporte' },
  ];

  const reportesEjemplo = [
    { id: 1, enviado: '2024-01-20 10:35:00', visto: '2024-01-20 11:20:00', solucion: 'Sí' },
    { id: 2, enviado: '2024-01-20 09:20:00', visto: '2024-01-20 10:15:00', solucion: 'Sí' },
    { id: 3, enviado: '2024-01-20 08:50:00', visto: 'No visto', solucion: 'No' },
  ];

  useEffect(() => {
    // Simular carga de datos
    setUsuarios(usuariosEjemplo);
    setFallas(fallasEjemplo);
    setReportes(reportesEjemplo);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditarUsuario = (usuario) => {
    setSelectedUser(usuario);
    setViewMode('edit');
  };

  const handleVerUsuario = (usuario) => {
    setSelectedUser(usuario);
    setViewMode('view');
  };

  const handleEliminarUsuario = (usuario) => {
    setSelectedUser(usuario);
    setShowDeleteConfirm(true);
  };

  const confirmarEliminarUsuario = () => {
    if (selectedUser) {
      setUsuarios(usuarios.filter(u => u.id !== selectedUser.id));
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    }
  };

  const handleAñadirUsuario = () => {
    setSelectedUser(null);
    setViewMode('add');
  };

  const handleEliminarTodasFallas = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar TODAS las fallas y reportes? Esta acción no se puede deshacer.')) {
      setFallas([]);
      setReportes([]);
      alert('Todas las fallas y reportes han sido eliminados');
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: 'bg-purple-100 text-purple-800', label: 'Admin' },
      operador: { color: 'bg-blue-100 text-blue-800', label: 'Operador' },
      servicio: { color: 'bg-green-100 text-green-800', label: 'Servicio' }
    };
    
    const config = roleConfig[role] || { color: 'bg-gray-100 text-gray-800', label: role };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getAccionBadge = (accion) => {
    return accion === 'Reporte' 
      ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Reporte</span>
      : <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">Nada</span>;
  };

  const getSolucionBadge = (solucion) => {
    return solucion === 'Sí'
      ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Sí</span>
      : <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">No</span>;
  };

  // Componente para ver/editar/añadir usuario
  const UserForm = () => {
    const [formData, setFormData] = useState(
      selectedUser || { name: '', email: '', role: '', ci: '', active: true }
    );

    const handleSave = () => {
      if (viewMode === 'add') {
        // Añadir nuevo usuario
        const newUser = { ...formData, id: Date.now() };
        setUsuarios([...usuarios, newUser]);
      } else if (viewMode === 'edit') {
        // Editar usuario existente
        setUsuarios(usuarios.map(u => u.id === selectedUser.id ? { ...formData, id: selectedUser.id } : u));
      }
      setViewMode('view');
      setSelectedUser(null);
    };

    const handleCancel = () => {
      setViewMode('view');
      setSelectedUser(null);
    };

    if (viewMode === 'view' && selectedUser) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detalles del Usuario</h3>
            <div className="space-y-3">
              <div><strong>Nombre:</strong> {selectedUser.name}</div>
              <div><strong>Email:</strong> {selectedUser.email}</div>
              <div><strong>CI:</strong> {selectedUser.ci}</div>
              <div><strong>Rol:</strong> {getRoleBadge(selectedUser.role)}</div>
              <div><strong>Estado:</strong> {selectedUser.active ? 'Activo' : 'Inactivo'}</div>
            </div>
            <button
              onClick={handleCancel}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition mt-4"
            >
              Cerrar
            </button>
          </div>
        </div>
      );
    }

    if (viewMode === 'edit' || viewMode === 'add') {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {viewMode === 'add' ? 'Añadir Usuario' : 'Editar Usuario'}
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="CI"
                value={formData.ci}
                onChange={(e) => setFormData({...formData, ci: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Seleccionar rol</option>
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
                <option value="servicio">Servicio Técnico</option>
              </select>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleSave}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition"
              >
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
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
                Bienvenido: <span className="text-plasma-primary">{user?.name || 'Administrador'}</span>
              </p>
              <p className="text-gray-600">Acceso: Administrador</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA - Manejo de Cuentas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Manejo de Cuentas</h2>
                <button
                  onClick={handleAñadirUsuario}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                >
                  + Añadir Usuario
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CI</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usuarios.map((usuario) => (
                      <tr key={usuario.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{usuario.name}</p>
                            <p className="text-sm text-gray-500">{usuario.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getRoleBadge(usuario.role)}</td>
                        <td className="px-4 py-3 text-gray-600">{usuario.ci}</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditarUsuario(usuario)}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleVerUsuario(usuario)}
                              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition"
                            >
                              Ver
                            </button>
                            {usuario.role !== 'admin' && (
                              <button
                                onClick={() => handleEliminarUsuario(usuario)}
                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA - Vistas de Fallas y Reportes */}
          <div className="space-y-6">
            {/* Vista de Fallas Globales */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Vista de Fallas Globales</h2>
                <button
                  onClick={handleEliminarTodasFallas}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition"
                >
                  Eliminar Todas
                </button>
              </div>
              
              <div className="space-y-3">
                {fallas.map((falla) => (
                  <div key={falla.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-800">Falla #{falla.id}</p>
                        <p className="text-sm text-gray-600">{falla.tipo}</p>
                        <p className="text-xs text-gray-500">{falla.fecha}</p>
                      </div>
                      {getAccionBadge(falla.accion)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vista de Reportes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Vista de Reportes</h2>
              
              <div className="space-y-3">
                {reportes.map((reporte) => (
                  <div key={reporte.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Enviado:</span>
                        <p className="font-medium">{reporte.enviado}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Visto:</span>
                        <p className="font-medium">{reporte.visto}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Solución:</span>
                        <div className="mt-1">{getSolucionBadge(reporte.solucion)}</div>
                      </div>
                    </div>
                  </div>
                ))}
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

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser?.name}</strong>? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmarEliminarUsuario}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition"
              >
                Sí, Eliminar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de usuario (Ver/Editar/Añadir) */}
      <UserForm />
    </div>
  );
};

export default DashboardAdmin;