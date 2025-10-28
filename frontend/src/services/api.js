// src/services/api.js - VERSIÓN CORREGIDA
import axios from 'axios';

// ✅ USAR VARIABLE DE ENTORNO en lugar de URL hardcodeada
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token automáticamente
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

// Servicios de sensores
export const sensorService = {
  getLatestData: async () => {
    const response = await api.get('/sensors/latest');
    return response.data;
  },

  getHistory: async (params) => {
    const response = await api.get('/sensors/history', { params });
    return response.data;
  },

  getStats: async (params) => {
    const response = await api.get('/sensors/stats', { params });
    return response.data;
  },
};

// Servicios de alertas
export const alertService = {
  getActiveAlerts: async () => {
    const response = await api.get('/alerts/active');
    return response.data;
  },

  getAllAlerts: async (params) => {
    const response = await api.get('/alerts', { params });
    return response.data;
  },

  acknowledgeAlert: async (id) => {
    const response = await api.post(`/alerts/${id}/acknowledge`);
    return response.data;
  },
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

export default api;