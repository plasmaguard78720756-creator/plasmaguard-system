import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeSelector from './components/ThemeSelector';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardOperador from './pages/DashboardOperador';
import DetallesFalla from './pages/DetallesFalla';
import ReportarFalla from './pages/ReportarFalla';
import VerificacionAdmin from './pages/VerificacionAdmin';
import DashboardAdmin from './pages/DashboardAdmin';
import VerificacionTecnico from './pages/VerificacionTecnico';
import DashboardTecnico from './pages/DashboardTecnico';
import ControlModos from './pages/ControlModos';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100" style={{ background: 'var(--bg-gradient, linear-gradient(to bottom right, #f0f9ff, #e0f2fe))' }}>
            <ThemeSelector />
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
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;