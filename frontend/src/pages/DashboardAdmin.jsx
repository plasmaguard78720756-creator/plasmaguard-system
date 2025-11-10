import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api'; 

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [usuarios, setUsuarios] = useState([]);
  const [fallas, setFallas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('view');
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(''); 

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

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('🔍 Cargando usuarios desde la base de datos...');
      const response = await userService.getAllUsers();
      
      if (response.success) {
        console.log('✅ Usuarios cargados:', response.data);
        setUsuarios(response.data);
      } else {
        setError('Error al cargar usuarios: ' + response.error);
        setUsuarios([]);
      }
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error);
      setError('Error de conexión al cargar usuarios');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
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

  const confirmarEliminarUsuario = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      const response = await userService.deleteUser(selectedUser.id);
      
      if (response.success) {
        setUsuarios(usuarios.filter(u => u.id !== selectedUser.id));
        setShowDeleteConfirm(false);
        setSelectedUser(null);
        alert('✅ Usuario eliminado exitosamente');
      } else {
        alert('❌ Error al eliminar usuario: ' + response.error);
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      alert('❌ Error de conexión al eliminar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleAñadirUsuario = () => {
    setSelectedUser(null);
    setViewMode('add');
  };

  const handleGuardarUsuario = async (formData) => {
    try {
      setLoading(true);
      
      let response;
      if (viewMode === 'add') {
        response = await userService.createUser(formData);
      } else {
        response = await userService.updateUser(selectedUser.id, formData);
      }

      if (response.success) {
        await cargarUsuarios();
        setViewMode('view');
        setSelectedUser(null);
        alert(`✅ ${response.message}`);
      } else {
        alert(`❌ ${response.error}`);
      }
    } catch (error) {
      console.error('Error guardando usuario:', error);
      alert('❌ Error de conexión al guardar usuario');
    } finally {
      setLoading(false);
    }
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
      : <span className="bg-gray-100 text-theme px-2 py-1 rounded text-xs font-medium">Nada</span>;
  };

  const getSolucionBadge = (solucion) => {
    return solucion === 'Sí'
      ? <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Sí</span>
      : <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">No</span>;
  };

  const UserForm = () => {
    const [formData, setFormData] = useState(
      selectedUser || { 
        name: '', 
        email: '', 
        role: '', 
        ci: '', 
        institucion: '', 
        celular: '',
        active: true 
      }
    );

    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
      const errors = {};
      
      if (!formData.name.trim()) errors.name = 'Nombre es requerido';
      if (!formData.email.trim()) errors.email = 'Email es requerido';
      if (!formData.role) errors.role = 'Rol es requerido';
      if (!formData.ci.trim()) errors.ci = 'CI es requerido';
      
      if (viewMode === 'add' && !formData.password) {
        errors.password = 'Contraseña es requerida';
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSave = () => {
      if (!validateForm()) return;

      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        ci: formData.ci,
        institucion: formData.institucion || '',
        celular: formData.celular || ''
      };

      if (viewMode === 'add') {
        userData.password = formData.password || 'password123'; 
      }

      handleGuardarUsuario(userData);
    };

    const handleCancel = () => {
      setViewMode('view');
      setSelectedUser(null);
    };

    if (viewMode === 'view' && selectedUser) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-theme-card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-theme mb-4">Detalles del Usuario</h3>
            <div className="space-y-3">
              <div><strong>Nombre:</strong> {selectedUser.name}</div>
              <div><strong>Email:</strong> {selectedUser.email}</div>
              <div><strong>CI:</strong> {selectedUser.ci}</div>
              <div><strong>Rol:</strong> {getRoleBadge(selectedUser.role)}</div>
              <div><strong>Institución:</strong> {selectedUser.institucion || 'No especificada'}</div>
              <div><strong>Celular:</strong> {selectedUser.celular || 'No especificado'}</div>
              <div><strong>Estado:</strong> {selectedUser.active ? 'Activo' : 'Inactivo'}</div>
              <div><strong>Fecha registro:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</div>
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
          <div className="bg-theme-card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-theme mb-4">
              {viewMode === 'add' ? 'Añadir Usuario' : 'Editar Usuario'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nombre completo"
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="usuario@gmail.com"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CI *
                </label>
                <input
                  type="text"
                  value={formData.ci}
                  onChange={(e) => setFormData({...formData, ci: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.ci ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="12345678"
                />
                {formErrors.ci && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.ci}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg ${
                    formErrors.role ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Seleccionar rol</option>
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                  <option value="servicio">Servicio Técnico</option>
                </select>
                {formErrors.role && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.role}</p>
                )}
              </div>

              {viewMode === 'add' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg ${
                      formErrors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Contraseña temporal"
                  />
                  {formErrors.password && (
                    <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    El usuario podrá cambiar su contraseña después
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institución
                </label>
                <input
                  type="text"
                  value={formData.institucion || ''}
                  onChange={(e) => setFormData({...formData, institucion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Hospital o institución"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Celular
                </label>
                <input
                  type="text"
                  value={formData.celular || ''}
                  onChange={(e) => setFormData({...formData, celular: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Número de celular"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition disabled:bg-green-300"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition disabled:bg-gray-300"
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

  if (loading && usuarios.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plasma-primary mx-auto"></div>
          <p className="mt-4 text-theme-muted">Cargando usuarios...</p>
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
          <p className="text-theme-muted mt-2">Seguridad y Confianza</p>
        </div>

        {/* Información del usuario */}
        <div className="bg-theme-card rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-theme">
                Bienvenido: <span className="text-plasma-primary">{user?.name || 'Administrador'}</span>
              </p>
              <p className="text-theme-muted">Acceso: Administrador</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={cargarUsuarios}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:bg-blue-300"
              >
                {loading ? '🔄' : '🔄'} Actualizar
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
          
          {/* Mensaje de error */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA - Manejo de Cuentas */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-theme-card rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-theme">
                  Manejo de Cuentas ({usuarios.length} usuarios)
                </h2>
                <button
                  onClick={handleAñadirUsuario}
                  disabled={loading}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition disabled:bg-green-300"
                >
                  + Añadir Usuario
                </button>
              </div>
              
              {usuarios.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No hay usuarios registrados</p>
                  <p className="text-gray-400 text-sm">Usa el botón "Añadir Usuario" para comenzar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CI</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-theme">{usuario.name}</p>
                              <p className="text-sm text-gray-500">{usuario.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">{getRoleBadge(usuario.role)}</td>
                          <td className="px-4 py-3 text-theme-muted">{usuario.ci}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              usuario.active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {usuario.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditarUsuario(usuario)}
                                disabled={loading}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition disabled:bg-blue-300"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleVerUsuario(usuario)}
                                disabled={loading}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 transition disabled:bg-gray-300"
                              >
                                Ver
                              </button>
                              {usuario.role !== 'admin' && (
                                <button
                                  onClick={() => handleEliminarUsuario(usuario)}
                                  disabled={loading}
                                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition disabled:bg-red-300"
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
              )}
            </div>
          </div>

          {/* COLUMNA DERECHA - Vistas de Fallas y Reportes */}
          <div className="space-y-6">
            {/* Vista de Fallas Globales */}
            <div className="bg-theme-card rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-theme">Vista de Fallas Globales</h2>
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
                        <p className="font-medium text-theme">Falla #{falla.id}</p>
                        <p className="text-sm text-theme-muted">{falla.tipo}</p>
                        <p className="text-xs text-gray-500">{falla.fecha}</p>
                      </div>
                      {getAccionBadge(falla.accion)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vista de Reportes */}
            <div className="bg-theme-card rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-theme mb-4">Vista de Reportes</h2>
              
              <div className="space-y-3">
                {reportes.map((reporte) => (
                  <div key={reporte.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-theme-muted">Enviado:</span>
                        <p className="font-medium">{reporte.enviado}</p>
                      </div>
                      <div>
                        <span className="text-theme-muted">Visto:</span>
                        <p className="font-medium">{reporte.visto}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-theme-muted">Solución:</span>
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
          <div className="bg-theme-card rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-600 mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser?.name}</strong>? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmarEliminarUsuario}
                disabled={loading}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition disabled:bg-red-300"
              >
                {loading ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition disabled:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de usuario (Ver/Editar/Añadir) */}
      <UserForm />
      <ThemeToggle />
    </div>
  );
};

export default DashboardAdmin;