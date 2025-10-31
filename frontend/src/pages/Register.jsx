import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    dia: '',
    mes: '',
    ano: '',
    ci: '',
    tipoUsuario: '',
    
    institucion: '',
    celular: '',
    direccion: '',
    correo: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const dias = Array.from({ length: 31 }, (_, i) => i + 1);
  const meses = [
    { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' }, { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
  ];
  const anos = Array.from({ length: 84 }, (_, i) => 2024 - i); // 1940 - 2024

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateField = (name, value) => {
    switch (name) {
      case 'nombre':
      case 'apellidoPaterno':
      case 'apellidoMaterno':
        if (!/^[A-Z][a-z]*$/.test(value)) {
          return 'Debe comenzar con mayúscula y solo contener letras';
        }
        break;
      
      case 'ci':
        if (!/^\d{7,9}$/.test(value)) {
          return 'Debe contener entre 7 y 9 dígitos';
        }
        break;
      
      case 'institucion':
        if (!/^[A-Za-z\s]{1,}(\d{0,2})?$/.test(value)) {
          return 'Solo letras y máximo 2 números';
        }
        break;
      
      case 'celular':
        if (!/^\d{8}$/.test(value)) {
          return 'Debe contener exactamente 8 dígitos';
        }
        break;
      
      case 'correo':
        if (!value.endsWith('@gmail.com')) {
          return 'El correo debe terminar con @gmail.com';
        }
        break;
      
      case 'password':
        if (value.length < 8 || value.length > 12) {
          return 'La contraseña debe tener entre 8 y 12 caracteres';
        }
        break;
      
      case 'confirmPassword':
        if (value !== formData.password) {
          return 'Las contraseñas no coinciden';
        }
        break;
      
      default:
        return '';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (!formData.dia || !formData.mes || !formData.ano) {
      newErrors.fecha = 'La fecha de nacimiento es requerida';
    } else {
      const edad = new Date().getFullYear() - parseInt(formData.ano);
      if (edad < 17 || edad > 100) {
        newErrors.fecha = 'Debes tener entre 17 y 100 años';
      }
    }

    if (!formData.tipoUsuario) {
      newErrors.tipoUsuario = 'Selecciona un tipo de usuario';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      if (formData.tipoUsuario === 'admin' || formData.tipoUsuario === 'servicio') {
        setShowVerification(true);
      } else {
        handleRegistrationSuccess();
      }
    }
  };

  const handleVerification = () => {
    const expectedCode = formData.tipoUsuario === 'admin' 
      ? 'PlasmaGuard1230' 
      : 'Servicio1230';

    if (verificationCode === expectedCode) {
      handleRegistrationSuccess();
    } else {
      alert('Código de verificación incorrecto');
    }
  };

  const handleRegistrationSuccess = async () => {
    try {
      const userData = {
        name: `${formData.nombre} ${formData.apellidoPaterno} ${formData.apellidoMaterno}`,
        email: formData.correo,
        password: formData.password,
        role: formData.tipoUsuario,
        ci: formData.ci,
        fecha_nacimiento: `${formData.ano}-${formData.mes}-${formData.dia}`,
        institucion: formData.institucion,
        celular: formData.celular,
        direccion: formData.direccion
      };

      const result = await register(userData);
      
      if (result.success) {
        alert(result.message || 'Usuario registrado exitosamente!');
        navigate('/');
      } else {
        alert(result.error || 'Error en el registro');
      }
    } catch (error) {
      alert('Error de conexión con el servidor');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-plasma-primary">PLASMAGUARD</h1>
        <p className="text-gray-600 mt-2">Seguridad y Confianza</p>
      </div>
      
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Registro de Nuevo Usuario</h2>
          <button 
            onClick={() => navigate('/')}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            ← Volver al Login
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-8">
            {/* PARTE IZQUIERDA - Información Personal */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-plasma-primary border-b pb-2">
                Información Personal
              </h3>
              
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Juan"
                />
                {errors.nombre && (
                  <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
                )}
              </div>

              {/* Apellido Paterno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  name="apellidoPaterno"
                  value={formData.apellidoPaterno}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition ${
                    errors.apellidoPaterno ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Pérez"
                />
                {errors.apellidoPaterno && (
                  <p className="text-red-500 text-sm mt-1">{errors.apellidoPaterno}</p>
                )}
              </div>

              {/* Apellido Materno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Materno *
                </label>
                <input
                  type="text"
                  name="apellidoMaterno"
                  value={formData.apellidoMaterno}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition ${
                    errors.apellidoMaterno ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: González"
                />
                {errors.apellidoMaterno && (
                  <p className="text-red-500 text-sm mt-1">{errors.apellidoMaterno}</p>
                )}
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <select
                    name="dia"
                    value={formData.dia}
                    onChange={handleInputChange}
                    className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary"
                  >
                    <option value="">Día</option>
                    {dias.map(dia => (
                      <option key={dia} value={dia}>{dia}</option>
                    ))}
                  </select>
                  
                  <select
                    name="mes"
                    value={formData.mes}
                    onChange={handleInputChange}
                    className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary"
                  >
                    <option value="">Mes</option>
                    {meses.map(mes => (
                      <option key={mes.value} value={mes.value}>{mes.label}</option>
                    ))}
                  </select>
                  
                  <select
                    name="ano"
                    value={formData.ano}
                    onChange={handleInputChange}
                    className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary"
                  >
                    <option value="">Año</option>
                    {anos.map(ano => (
                      <option key={ano} value={ano}>{ano}</option>
                    ))}
                  </select>
                </div>
                {errors.fecha && (
                  <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>
                )}
              </div>

              {/* CI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Carnet de Identidad *
                </label>
                <input
                  type="text"
                  name="ci"
                  value={formData.ci}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition ${
                    errors.ci ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 12345678"
                />
                {errors.ci && (
                  <p className="text-red-500 text-sm mt-1">{errors.ci}</p>
                )}
              </div>

              {/* Tipo de Usuario - CORREGIDO */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Usuario *
                </label>
                <select
                  name="tipoUsuario"
                  value={formData.tipoUsuario}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition ${
                    errors.tipoUsuario ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona un tipo</option>
                  <option value="operador">Operador</option>
                  <option value="admin">Administrador</option>
                  <option value="servicio">Servicio Técnico</option>
                </select>
                {errors.tipoUsuario && (
                  <p className="text-red-500 text-sm mt-1">{errors.tipoUsuario}</p>
                )}
              </div>
            </div>

            {/* PARTE DERECHA - Información de Contacto */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-plasma-primary border-b pb-2">
                Información de Contacto
              </h3>

              {/* Institución */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institución/Hospital *
                </label>
                <input
                  type="text"
                  name="institucion"
                  value={formData.institucion}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition ${
                    errors.institucion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: Hospital General"
                />
                {errors.institucion && (
                  <p className="text-red-500 text-sm mt-1">{errors.institucion}</p>
                )}
              </div>

              {/* Celular */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Celular *
                </label>
                <input
                  type="text"
                  name="celular"
                  value={formData.celular}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition ${
                    errors.celular ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: 71234567"
                />
                {errors.celular && (
                  <p className="text-red-500 text-sm mt-1">{errors.celular}</p>
                )}
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition"
                  placeholder="Ej: Av. Siempre Viva 123"
                />
              </div>

              {/* Correo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition ${
                    errors.correo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ej: usuario@gmail.com"
                />
                {errors.correo && (
                  <p className="text-red-500 text-sm mt-1">{errors.correo}</p>
                )}
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="8-12 caracteres"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Repite tu contraseña"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-plasma-primary text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Crear Cuenta
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Verificación */}
      {showVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Verificación de {formData.tipoUsuario === 'admin' ? 'Administrador' : 'Servicio Técnico'}
            </h3>
            <p className="text-gray-600 mb-4">
              Ingresa el código de verificación para completar el registro:
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-plasma-primary"
              placeholder="Código de verificación"
            />
            <div className="flex gap-3">
              <button
                onClick={handleVerification}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition"
              >
                Verificar
              </button>
              <button
                onClick={() => setShowVerification(false)}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;