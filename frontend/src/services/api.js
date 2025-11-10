import axios from 'axios';

// USAR VARIABLE DE ENTORNO en lugar de URL hardcodeada
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('plasmaguard_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('plasmaguard_token');
      localStorage.removeItem('plasmaguard_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de autenticación
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
};

// Servicios de usuarios
export const userService = {
  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
};

// Servicios de sensores (ACTUALIZADOS para gráficas)
export const sensorService = {
  getLatestData: async () => {
    const response = await api.get('/sensors/latest');
    return response.data;
  },

  getHistory: async (params = {}) => {
    const response = await api.get('/sensors/history', { params });
    return response.data;
  },

  getStats: async (params = {}) => {
    const response = await api.get('/sensors/stats', { params });
    return response.data;
  },

  // Nuevo método para datos de gráficas optimizados
  getChartData: async (hours = 24, limit = 100) => {
    const response = await api.get('/sensors/history', { 
      params: { hours, limit } 
    });
    return response.data;
  },

  // Método para obtener estado del sistema
  getSystemStatus: async () => {
    const response = await api.get('/sensors/status');
    return response.data;
  }
};

// Servicios de alertas MEJORADOS (con parámetros para filtros inteligentes)
export const alertService = {
  getActiveAlerts: async (params = {}) => {
    const response = await api.get('/alerts/active', { params });
    return response.data;
  },

  getAllAlerts: async (params = {}) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  acknowledgeAlert: async (id, userId = null) => {
    const data = userId ? { user_id: userId } : {};
    const response = await api.post(`/alerts/${id}/acknowledge`, data);
    return response.data;
  },

  // Nuevo método para obtener estadísticas de alertas
  getAlertStats: async (hours = 24) => {
    const response = await api.get('/alerts/active', { params: { hours } });
    return response.data.stats || {};
  },

  // Nuevo método para enviar reportes por email (OPCIONAL - simulado)
  sendEmailReport: async (reportData) => {
    const response = await api.post('/alerts/send-email-report', reportData);
    return response.data;
  }
};

// Servicios de control
export const controlService = {
  getControlStatus: async () => {
    const response = await api.get('/control/status');
    return response.data;
  },

  updateOperationMode: async (modeData) => {
    const response = await api.post('/control/mode', modeData);
    return response.data;
  },

  controlManualLights: async (lightsData) => {
    const response = await api.post('/control/manual-lights', lightsData);
    return response.data;
  },

  setSimulationData: async (simulationData) => {
    const response = await api.post('/control/simulation-data', simulationData);
    return response.data;
  },

  getAllUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Función adicional para cambiar estado de usuario
  toggleUserStatus: async (id, active) => {
    const response = await api.patch(`/users/${id}/status`, { active });
    return response.data;
  }
};

// Servicios del sistema (NUEVOS)
export const systemService = {
  // Verificar salud del sistema
  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Obtener diagnóstico del sistema
  getDiagnostic: async () => {
    const response = await api.get('/diagnostic');
    return response.data;
  },

  // Probar conexión con la base de datos
  testDatabase: async () => {
    const response = await api.get('/test-db');
    return response.data;
  }
};

// Función de utilidad para probar conexión
export const testBackendConnection = async () => {
  try {
    console.log('🔍 Probando conexión con backend...');
    
    const healthResponse = await systemService.getHealth();
    console.log('✅ Health Check:', healthResponse);
    
    const dbResponse = await systemService.testDatabase();
    console.log('✅ Database Test:', dbResponse);
    
    return { 
      success: true, 
      health: healthResponse, 
      db: dbResponse 
    };
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

export default api;