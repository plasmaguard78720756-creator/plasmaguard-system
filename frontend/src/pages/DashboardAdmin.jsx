// src/pages/DashboardAdmin.jsx - VERSIÓN SOLO DATOS REALES
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../contexts/AuthContext';

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [usuarios, setUsuarios] = useState([]);
  const [fallas, setFallas] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('view');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

  const fetchDataFromSupabase = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Cargando datos REALES de Supabase...');

      // 1. Obtener usuarios REALES de Supabase
      const { data: usuariosReales, error: usuariosError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usuariosError) {
        console.error('❌ Error obteniendo usuarios:', usuariosError);
        throw new Error(`Error usuarios: ${usuariosError.message}`);
      }

      console.log('✅ Usuarios cargados de Supabase:', usuariosReales);

      // 2. Obtener alertas como fallas
      const { data: fallasReales, error: fallasError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // 3. Obtener reportes de mantenimiento
      const { data: reportesReales, error: reportesError } = await supabase
        .from('maintenance_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Transformar datos de usuarios
      const usuariosTransformados = usuariosReales?.map(usuario => ({
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        ci: usuario.ci || 'No asignado',
        fecha_nacimiento: usuario.fecha_nacimiento,
        institucion: usuario.institucion || 'No especificada',
        celular: usuario.celular || 'No especificado',
        direccion: usuario.direccion || 'No especificada',
        active: usuario.active
      })) || [];

      // Transformar alertas a formato de fallas
      const fallasTransformadas = fallasReales?.map(alerta => ({
        id: alerta.id,
        tipo: alerta.type,
        fecha: new Date(alerta.created_at).toLocaleString('es-ES'),
        accion: alerta.acknowledged ? 'Reporte' : 'Nada'
      })) || [];

      // Transformar reportes de mantenimiento
      const reportesTransformados = reportesReales?.map(reporte => ({
        id: reporte.id,
        enviado: new Date(reporte.created_at).toLocaleString('es-ES'),
        visto: reporte.started_at ? new Date(reporte.started_at).toLocaleString('es-ES') : 'No visto',
        solucion: reporte.status === 'completed' ? 'Sí' : 'No'
      })) || [];

      // ✅ SOLO USAR DATOS REALES - NUNCA DATOS DE EJEMPLO
      setUsuarios(usuariosTransformados);
      setFallas(fallasTransformadas);
      setReportes(reportesTransformados);

      console.log('🎉 Datos actualizados:', {
        usuarios: usuariosTransformados.length,
        fallas: fallasTransformadas.length,
        reportes: reportesTransformados.length
      });

    } catch (error) {
      console.error('💥 Error cargando datos:', error);
      setError(error.message);
      // ❌ NO USAR DATOS DE EJEMPLO - dejar arrays vacíos
      setUsuarios([]);
      setFallas([]);
      setReportes([]);
    } finally {
      setLoading(false);
    }
  };

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
    if (selectedUser) {
      try {
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', selectedUser.id);

        if (error) throw error;

        setUsuarios(usuarios.filter(u => u.id !== selectedUser.id));
        alert('✅ Usuario eliminado correctamente');
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        alert('❌ Error al eliminar usuario');
      }
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    }
  };

  const handleAñadirUsuario = () => {
    setSelectedUser({
      name: '',
      email: '',
      role: '',
      ci: '',
      fecha_nacimiento: '',
      institucion: '',
      celular: '',
      direccion: '',
      active: true
    });
    setViewMode('add');
  };

  const handleEliminarTodasFallas = async () => {
    if (window.confirm('¿Estás seguro de eliminar TODAS las fallas?')) {
      try {
        const { error } = await supabase
          .from('alerts')
          .delete()
          .neq('id', 0);

        if (error) throw error;

        setFallas([]);
        alert('✅ Fallas eliminadas');
      } catch (error) {
        console.error('Error eliminando fallas:', error);
        alert('❌ Error al eliminar fallas');
      }
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

  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  // Componente para ver/editar/añadir usuario
  const UserForm = () => {
    const [formData, setFormData] = useState(selectedUser);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      if (!formData.name || !formData.email || !formData.role) {
        alert('Complete los campos obligatorios: Nombre, Email y Rol');
        return;
      }

      try {
        setSaving(true);
        
        if (viewMode === 'add') {
          const { data, error } = await supabase
            .from('users')
            .insert([{
              name: formData.name,
              email: formData.email,
              role: formData.role,
              ci: formData.ci,
              fecha_nacimiento: formData.fecha_nacimiento || null,
              institucion: formData.institucion,
              celular: formData.celular,
              direccion: formData.direccion,
              active: formData.active,
              password: 'temp123'
            }])
            .select();

          if (error) throw error;
          
          setUsuarios([...usuarios, { ...formData, id: data[0].id }]);
          alert('✅ Usuario añadido');
        } else {
          const { error } = await supabase
            .from('users')
            .update(formData)
            .eq('id', selectedUser.id);

          if (error) throw error;
          
          setUsuarios(usuarios.map(u => u.id === selectedUser.id ? formData : u));
          alert('✅ Usuario actualizado');
        }
        
        setViewMode('view');
        setSelectedUser(null);
      } catch (error) {
        console.error('Error guardando:', error);
        alert('❌ Error al guardar: ' + error.message);
      } finally {
        setSaving(false);
      }
    };

    if (!formData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {viewMode === 'add' ? 'Añadir Usuario' : 'Editar Usuario'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Nombre completo *"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <div>
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            
            <div>
              <input
                type="text"
                placeholder="CI"
                value={formData.ci}
                onChange={(e) => setFormData({...formData, ci: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <input
                type="date"
                value={formData.fecha_nacimiento}
                onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <input
                type="text"
                placeholder="Institución"
                value={formData.institucion}
                onChange={(e) => setFormData({...formData, institucion: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <input
                type="tel"
                placeholder="Celular"
                value={formData.celular}
                onChange={(e) => setFormData({...formData, celular: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div className="md:col-span-2">
              <textarea
                placeholder="Dirección"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            
            <div>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Seleccionar rol *</option>
                <option value="operador">Operador</option>
                <option value="admin">Administrador</option>
                <option value="servicio">Servicio Técnico</option>
              </select>
            </div>
            
            <div className="flex items-center justify-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Activo</span>
              </label>
            </div>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button
              onClick={() => { setViewMode('view'); setSelectedUser(null); }}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos reales de la base de datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">PLASMAGUARD</h1>
          <p className="text-gray-600 mt-2">Panel de Administración</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold">
                Bienvenido: <span className="text-blue-600">{user?.name}</span>
              </p>
              <p className="text-gray-600">Modo: Administrador</p>
              {error && (
                <p className="text-red-500 text-sm mt-1">Error: {error}</p>
              )}
              <p className={`text-sm mt-1 ${
                usuarios.length > 0 ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {usuarios.length > 0 
                  ? `✅ ${usuarios.length} usuarios cargados de Supabase` 
                  : '⚠️ No hay usuarios en la base de datos'
                }
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={fetchDataFromSupabase}
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
              >
                🔄 Actualizar
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">
                  Gestión de Usuarios
                </h2>
                <button
                  onClick={handleAñadirUsuario}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  + Añadir Usuario
                </button>
              </div>

              {usuarios.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No hay usuarios en la base de datos</p>
                  <p className="text-gray-400 text-sm">Usa el botón "Añadir Usuario" para crear el primero</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left">Usuario</th>
                        <th className="px-4 py-3 text-left">Rol</th>
                        <th className="px-4 py-3 text-left">CI</th>
                        <th className="px-4 py-3 text-left">Estado</th>
                        <th className="px-4 py-3 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium">{usuario.name}</p>
                              <p className="text-sm text-gray-500">{usuario.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">{getRoleBadge(usuario.role)}</td>
                          <td className="px-4 py-3">{usuario.ci}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              usuario.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {usuario.active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditarUsuario(usuario)}
                                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleVerUsuario(usuario)}
                                className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                              >
                                Ver
                              </button>
                              {usuario.role !== 'admin' && (
                                <button
                                  onClick={() => handleEliminarUsuario(usuario)}
                                  className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
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

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Fallas Recientes</h2>
              <div className="space-y-3">
                {fallas.map(falla => (
                  <div key={falla.id} className="border rounded p-3">
                    <p className="font-medium">{falla.tipo}</p>
                    <p className="text-sm text-gray-600">{falla.fecha}</p>
                    {getAccionBadge(falla.accion)}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">Reportes</h2>
              <div className="space-y-3">
                {reportes.map(reporte => (
                  <div key={reporte.id} className="border rounded p-3">
                    <p className="text-sm">Enviado: {reporte.enviado}</p>
                    <p className="text-sm">Visto: {reporte.visto}</p>
                    {getSolucionBadge(reporte.solucion)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-red-600 mb-4">Confirmar Eliminación</h3>
              <p className="mb-4">¿Eliminar a {selectedUser?.name}?</p>
              <div className="flex space-x-3">
                <button onClick={confirmarEliminarUsuario} className="flex-1 bg-red-500 text-white p-2 rounded">
                  Sí, Eliminar
                </button>
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-gray-500 text-white p-2 rounded">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {(viewMode === 'edit' || viewMode === 'add') && <UserForm />}
      </div>
    </div>
  );
};

export default DashboardAdmin;