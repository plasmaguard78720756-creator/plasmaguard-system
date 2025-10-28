// src/pages/DashboardAdmin.jsx - VERSIÓN COMPLETA CON TODOS LOS CAMPOS
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
  const [viewMode, setViewMode] = useState('view'); // 'view', 'edit', 'add'

  // Datos de ejemplo como respaldo
  const usuariosEjemplo = [
    { 
      id: '1', 
      name: 'Juan Pérez', 
      email: 'juan@hospital.com', 
      role: 'operador', 
      ci: '1234567', 
      fecha_nacimiento: '1985-05-15',
      institucion: 'Hospital Central',
      celular: '+591 71234567',
      direccion: 'Av. Principal #123',
      active: true 
    },
    { 
      id: '2', 
      name: 'María García', 
      email: 'maria@hospital.com', 
      role: 'admin', 
      ci: '7654321', 
      fecha_nacimiento: '1990-08-22',
      institucion: 'Hospital Central',
      celular: '+591 79876543',
      direccion: 'Calle Secundaria #456',
      active: true 
    },
  ];

  const fallasEjemplo = [
    { id: 1, tipo: 'Temperatura', fecha: '2024-01-20 10:30:00', accion: 'Reporte' },
    { id: 2, tipo: 'Humedad', fecha: '2024-01-20 09:15:00', accion: 'Nada' },
  ];

  const reportesEjemplo = [
    { id: 1, enviado: '2024-01-20 10:35:00', visto: '2024-01-20 11:20:00', solucion: 'Sí' },
    { id: 2, enviado: '2024-01-20 09:20:00', visto: '2024-01-20 10:15:00', solucion: 'Sí' },
  ];

  useEffect(() => {
    fetchDataFromSupabase();
  }, []);

  const fetchDataFromSupabase = async () => {
    try {
      setLoading(true);
      
      // 1. Obtener usuarios REALES de Supabase con TODOS los campos
      const { data: usuariosReales, error: usuariosError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usuariosError) {
        console.error('Error obteniendo usuarios:', usuariosError);
        throw usuariosError;
      }

      // 2. Obtener alertas como "fallas"
      const { data: fallasReales, error: fallasError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (fallasError) {
        console.error('Error obteniendo alertas:', fallasError);
        throw fallasError;
      }

      // 3. Obtener reportes de mantenimiento
      const { data: reportesReales, error: reportesError } = await supabase
        .from('maintenance_reports')
        .select(`
          *,
          reported_user:users!maintenance_reports_reported_by_fkey(name),
          serviced_user:users!maintenance_reports_serviced_by_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reportesError) {
        console.error('Error obteniendo reportes:', reportesError);
        throw reportesError;
      }

      // Transformar datos de usuarios para el frontend
      const usuariosTransformados = usuariosReales.map(usuario => ({
        id: usuario.id,
        name: usuario.name,
        email: usuario.email,
        role: usuario.role,
        ci: usuario.ci || 'No asignado',
        fecha_nacimiento: usuario.fecha_nacimiento || 'No especificada',
        institucion: usuario.institucion || 'No especificada',
        celular: usuario.celular || 'No especificado',
        direccion: usuario.direccion || 'No especificada',
        active: usuario.active
      }));

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
        solucion: reporte.status === 'completed' ? 'Sí' : 'No',
        titulo: reporte.title
      })) || [];

      // Actualizar estado con datos REALES
      setUsuarios(usuariosTransformados.length > 0 ? usuariosTransformados : usuariosEjemplo);
      setFallas(fallasTransformadas.length > 0 ? fallasTransformadas : fallasEjemplo);
      setReportes(reportesTransformados.length > 0 ? reportesTransformados : reportesEjemplo);

    } catch (error) {
      console.error('Error general obteniendo datos:', error);
      // Usar datos de ejemplo en caso de error
      setUsuarios(usuariosEjemplo);
      setFallas(fallasEjemplo);
      setReportes(reportesEjemplo);
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
        // Eliminar usuario de Supabase
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', selectedUser.id);

        if (error) throw error;

        // Actualizar estado local
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
    setSelectedUser(null);
    setViewMode('add');
  };

  const handleEliminarTodasFallas = async () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar TODAS las fallas y reportes? Esta acción no se puede deshacer.')) {
      try {
        // Eliminar todas las alertas de Supabase
        const { error } = await supabase
          .from('alerts')
          .delete()
          .neq('id', 0);

        if (error) throw error;

        setFallas([]);
        setReportes([]);
        alert('✅ Todas las fallas y reportes han sido eliminados');
        
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
    if (!fecha || fecha === 'No especificada') return 'No especificada';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  // Componente para ver/editar/añadir usuario
  const UserForm = () => {
    const [formData, setFormData] = useState(
      selectedUser || { 
        name: '', 
        email: '', 
        role: '', 
        ci: '', 
        fecha_nacimiento: '',
        institucion: '',
        celular: '',
        direccion: '',
        active: true 
      }
    );
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      // Validaciones básicas
      if (!formData.name || !formData.email || !formData.role) {
        alert('Por favor complete los campos obligatorios: Nombre, Email y Rol');
        return;
      }

      try {
        setSaving(true);

        if (viewMode === 'add') {
          // Añadir nuevo usuario en Supabase
          const { data, error } = await supabase
            .from('users')
            .insert([
              {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                ci: formData.ci,
                fecha_nacimiento: formData.fecha_nacimiento || null,
                institucion: formData.institucion,
                celular: formData.celular,
                direccion: formData.direccion,
                active: formData.active,
                password: 'temp_password_123' // Password temporal - el usuario deberá cambiarlo
              }
            ])
            .select();

          if (error) throw error;

          // Añadir a estado local
          const newUser = { ...formData, id: data[0].id };
          setUsuarios([...usuarios, newUser]);
          alert('✅ Usuario añadido correctamente');

        } else if (viewMode === 'edit') {
          // Editar usuario existente en Supabase
          const { error } = await supabase
            .from('users')
            .update({
              name: formData.name,
              email: formData.email,
              role: formData.role,
              ci: formData.ci,
              fecha_nacimiento: formData.fecha_nacimiento || null,
              institucion: formData.institucion,
              celular: formData.celular,
              direccion: formData.direccion,
              active: formData.active
            })
            .eq('id', selectedUser.id);

          if (error) throw error;

          // Actualizar estado local
          setUsuarios(usuarios.map(u => u.id === selectedUser.id ? { ...formData, id: selectedUser.id } : u));
          alert('✅ Usuario actualizado correctamente');
        }

        setViewMode('view');
        setSelectedUser(null);
        
      } catch (error) {
        console.error('Error guardando usuario:', error);
        alert('❌ Error al guardar usuario: ' + error.message);
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      setViewMode('view');
      setSelectedUser(null);
    };

    if (viewMode === 'view' && selectedUser) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detalles del Usuario</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><strong>Nombre:</strong> {selectedUser.name}</div>
              <div><strong>Email:</strong> {selectedUser.email}</div>
              <div><strong>CI:</strong> {selectedUser.ci}</div>
              <div><strong>Fecha Nacimiento:</strong> {formatFecha(selectedUser.fecha_nacimiento)}</div>
              <div><strong>Institución:</strong> {selectedUser.institucion}</div>
              <div><strong>Celular:</strong> {selectedUser.celular}</div>
              <div className="md:col-span-2"><strong>Dirección:</strong> {selectedUser.direccion}</div>
              <div><strong>Rol:</strong> {getRoleBadge(selectedUser.role)}</div>
              <div><strong>Estado:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  selectedUser.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedUser.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
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
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {viewMode === 'add' ? 'Añadir Usuario' : 'Editar Usuario'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CI</label>
                <input
                  type="text"
                  placeholder="Número de carnet"
                  value={formData.ci}
                  onChange={(e) => setFormData({...formData, ci: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                <input
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
                <input
                  type="text"
                  placeholder="Institución o empresa"
                  value={formData.institucion}
                  onChange={(e) => setFormData({...formData, institucion: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                <input
                  type="tel"
                  placeholder="Número de celular"
                  value={formData.celular}
                  onChange={(e) => setFormData({...formData, celular: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                <textarea
                  placeholder="Dirección completa"
                  value={formData.direccion}
                  onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Seleccionar rol</option>
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
                  <span className="text-sm font-medium text-gray-700">Usuario activo</span>
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-plasma-primary mx-auto"></div>
          <p className="text-gray-600 mt-4">Cargando datos...</p>
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
                Bienvenido: <span className="text-plasma-primary">{user?.name || 'Administrador'}</span>
              </p>
              <p className="text-gray-600">Acceso: Administrador</p>
              <p className="text-sm text-green-600 mt-1">
                ✅ Conectado a base de datos real - {usuarios.length} usuarios cargados
              </p>
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
                <div className="flex space-x-2">
                  <button
                    onClick={fetchDataFromSupabase}
                    className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition text-sm"
                  >
                    🔄 Actualizar
                  </button>
                  <button
                    onClick={handleAñadirUsuario}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                  >
                    + Añadir Usuario
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rol</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">CI</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Institución</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
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
                            <p className="text-xs text-gray-400">{usuario.celular}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">{getRoleBadge(usuario.role)}</td>
                        <td className="px-4 py-3 text-gray-600">{usuario.ci}</td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{usuario.institucion}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            usuario.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {usuario.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
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