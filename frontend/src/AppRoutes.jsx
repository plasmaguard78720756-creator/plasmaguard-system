// src/AppRoutes.jsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';  

// Pages (las crearemos después)
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardOperador from './pages/DashboardOperador';
import VerificacionAdmin from './pages/VerificacionAdmin';
import DashboardAdmin from './pages/DashboardAdmin';
import VerificacionTecnico from './pages/VerificacionTecnico';
import DashboardTecnico from './pages/DashboardTecnico';
import ControlModos from './pages/ControlModos';
import DetallesFalla from './pages/DetallesFalla';
import ReportarFalla from './pages/ReportarFalla';

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Rutas de Operador */}
      <Route path="/operador/dashboard" element={<DashboardOperador />} />
      <Route path="/operador/falla/:id" element={<DetallesFalla />} />
      <Route path="/operador/reportar/:id" element={<ReportarFalla />} />
      
      {/* Rutas de Administrador */}
      <Route path="/admin/verificar" element={<VerificacionAdmin />} />
      <Route path="/admin/dashboard" element={<DashboardAdmin />} />
      
      {/* Rutas de Servicio Técnico */}
      <Route path="/tecnico/verificar" element={<VerificacionTecnico />} />
      <Route path="/tecnico/dashboard" element={<DashboardTecnico />} />
      <Route path="/tecnico/control" element={<ControlModos />} />
      
      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;