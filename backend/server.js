const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const userRoutes = require('./routes/users');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// SISTEMA DE MONITOREO Y AUTORECONEXIÓN
// =====================================================

let lastDataReceived = Date.now();
const DATA_TIMEOUT = 45000; // 45 segundos sin datos = problema (basado en tus 6.5 min)
let totalDataReceived = 0;

// =====================================================
// MIDDLEWARE Y CONFIGURACIÓN - ORDEN CORREGIDO
// =====================================================

// 1. CORS PRIMERO - ESENCIAL para todas las requests
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://plasmaguard-prod.vercel.app',
    'https://plasmaguard-system-k2n1.vercel.app',
    'https://plasmaguard.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// 2. Manejar explícitamente requests OPTIONS (preflight)
app.options('*', cors());

// 3. Seguridad
app.use(helmet());

// 4. Body parser
app.use(express.json({ limit: '10mb' }));

// 5. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    error: 'Demasiadas requests',
    message: 'Intenta nuevamente en 15 minutos'
  },
  skip: (req) => {
    return req.path === '/api/sensors/data' && 
           req.headers['x-api-key'] === process.env.API_KEY;
  }
});
app.use(limiter);

// 6. Middleware para detectar datos del ESP32 (DESPUÉS de CORS)
app.use('/api/sensors/data', (req, res, next) => {
  lastDataReceived = Date.now();
  totalDataReceived++;
  console.log(`📊 Datos recibidos: ${totalDataReceived} - Último: ${new Date().toLocaleTimeString()}`);
  next();
});

// =====================================================
// FUNCIONES DE MONITOREO
// =====================================================

// Función de verificación periódica
function checkDataFlow() {
  const timeSinceLastData = Date.now() - lastDataReceived;
  const secondsSinceLastData = Math.round(timeSinceLastData / 1000);
  
  if (timeSinceLastData > DATA_TIMEOUT) {
    console.log(`🚨 ALERTA: No se reciben datos del ESP32 desde hace ${secondsSinceLastData} segundos`);
    console.log(`📈 Total de datos recibidos en esta sesión: ${totalDataReceived}`);
    
    // Posibles causas a verificar
    if (secondsSinceLastData > 120) {
      console.log('🔍 Posible causa: ESP32 desconectado o sin WiFi');
    } else if (secondsSinceLastData > 60) {
      console.log('🔍 Posible causa: Problema de red o timeout');
    }
  } else if (timeSinceLastData > 20000) {
    // Advertencia temprana
    console.log(`⚠️  Advertencia: Sin datos por ${secondsSinceLastData} segundos`);
  }
}

// Verificar cada 15 segundos
setInterval(checkDataFlow, 15000);

// Función para verificar conexión a Supabase
async function checkSupabaseConnection() {
  try {
    const supabase = require('./config/database');
    const { error } = await supabase
      .from('system_config')
      .select('key')
      .limit(1);
    
    if (error) {
      console.log('🔴 Error de conexión a Supabase:', error.message);
    } else {
      console.log('✅ Conexión a Supabase estable');
    }
  } catch (error) {
    console.log('🔴 Error verificando Supabase:', error.message);
  }
}

// Verificar conexión a BD cada 2 minutos
setInterval(checkSupabaseConnection, 120000);

// =====================================================
// IMPORTAR Y USAR RUTAS
// =====================================================

// Importar rutas
const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensors');
const alertRoutes = require('./routes/alerts');
const controlRoutes = require('./routes/control'); 

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/control', controlRoutes); 
app.use('/api/users', userRoutes);

// =====================================================
// RUTAS MEJORADAS
// =====================================================

// Ruta de verificación de salud MEJORADA
app.get('/api/health', (req, res) => {
  const timeSinceLastData = Date.now() - lastDataReceived;
  const secondsSinceLastData = Math.round(timeSinceLastData / 1000);
  
  let dataStatus = 'healthy';
  if (timeSinceLastData > DATA_TIMEOUT) dataStatus = 'critical';
  else if (timeSinceLastData > 20000) dataStatus = 'warning';
  
  res.json({ 
    status: 'OK', 
    message: 'Sistema de monitoreo de plasma funcionando',
    timestamp: new Date().toISOString(),
    data_flow: {
      status: dataStatus,
      last_data_received: new Date(lastDataReceived).toISOString(),
      seconds_since_last_data: secondsSinceLastData,
      total_data_received: totalDataReceived,
      data_rate_healthy: secondsSinceLastData < 30
    },
    system: {
      uptime: Math.round(process.uptime()),
      database: 'Supabase',
      version: '1.0.0'
    }
  });
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  const timeSinceLastData = Date.now() - lastDataReceived;
  const secondsSinceLastData = Math.round(timeSinceLastData / 1000);
  
  res.json({
    message: '🚀 Bienvenido al Sistema de Monitoreo de Plasma',
    version: '1.0.0',
    system_status: {
      data_flow: secondsSinceLastData < 30 ? '🟢 Activo' : '🟡 Inactivo',
      last_data: `${secondsSinceLastData} segundos atrás`,
      total_received: totalDataReceived
    },
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      sensors: '/api/sensors',
      alerts: '/api/alerts',
      control: '/api/control'
    },
    documentation: 'Consulta la documentación para usar la API'
  });
});

// Ruta para probar conexión con Supabase
app.get('/api/test-db', async (req, res) => {
  try {
    const supabase = require('./config/database');
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) throw error;

    res.json({ 
      success: true,
      message: '✅ Conexión a Supabase exitosa',
      database: 'Conectado correctamente',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: '❌ Error conectando a Supabase',
      error: error.message 
    });
  }
});

// Ruta de diagnóstico del sistema
app.get('/api/diagnostic', (req, res) => {
  const timeSinceLastData = Date.now() - lastDataReceived;
  
  res.json({
    system: {
      node_version: process.version,
      platform: process.platform,
      uptime: Math.round(process.uptime()),
      memory_usage: process.memoryUsage()
    },
    data_flow: {
      last_data_received: new Date(lastDataReceived).toISOString(),
      seconds_since_last_data: Math.round(timeSinceLastData / 1000),
      total_data_received: totalDataReceived,
      status: timeSinceLastData < 30000 ? 'healthy' : 'stalled'
    },
    recommendations: timeSinceLastData > 30000 ? [
      'Verificar conexión WiFi del ESP32',
      'Revisar alimentación del ESP32',
      'Comprovar que el ESP32 esté ejecutando el código correctamente'
    ] : ['Sistema funcionando correctamente']
  });
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    available_endpoints: {
      home: '/',
      health: '/api/health',
      diagnostic: '/api/diagnostic',
      test_db: '/api/test-db',
      auth: '/api/auth/*',
      sensors: '/api/sensors/*',
      alerts: '/api/alerts/*',
      control: '/api/control/*'
    }
  });
});

// Manejo de errores global
app.use((error, req, res, next) => {
  console.error('Error del servidor:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Contacta al administrador',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// INICIO DEL SERVIDOR
// =====================================================

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📊 Sistema de Monitoreo de Plasma`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Diagnostic: http://localhost:${PORT}/api/diagnostic`);
  console.log(`🗄️  Test DB: http://localhost:${PORT}/api/test-db`);
  console.log(`\n📋 Endpoints disponibles:`);
  console.log(`   GET  /                 - Página de inicio`);
  console.log(`   GET  /api/health       - Estado del sistema`);
  console.log(`   GET  /api/diagnostic   - Diagnóstico completo`);
  console.log(`   GET  /api/test-db      - Test conexión BD`);
  console.log(`   POST /api/sensors/data - Recibir datos ESP32`);
  console.log(`   GET  /api/sensors/latest - Última lectura`);
  console.log(`   GET  /api/alerts/active - Alertas activas`);
  console.log(`\n🔍 Monitor activado:`);
  console.log(`   - Verificación de datos cada 15 segundos`);
  console.log(`   - Timeout de datos: 45 segundos`);
  console.log(`   - Verificación BD cada 2 minutos`);
  console.log(`\n⚡ Listo para recibir datos del ESP32!`);
  console.log(`📊 Contador de datos iniciado: 0`);
});". De test-register.js: "// backend/test-register.js
const supabase = require('./config/database');

async function testTable() {
  try {
    console.log('🔍 Probando estructura de tabla users...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accediendo a la tabla:', error);
    } else {
      console.log('✅ Tabla users accesible');
      console.log('Estructura:', data.length > 0 ? Object.keys(data[0]) : 'Tabla vacía');
    }
  } catch (error) {
    console.log('❌ Error general:', error);
  }
}

testTable();