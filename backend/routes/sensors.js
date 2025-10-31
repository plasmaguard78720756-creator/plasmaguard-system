const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');

const verifyApiKey = (req, res, next) => {
  const timeout = setTimeout(() => {
    console.log('🔐 ⏰ Timeout en verifyApiKey - permitiendo continuar por seguridad');
    next();
  }, 1000); 

  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      console.log('🔐 ❌ No se recibió API Key');
      clearTimeout(timeout);
      return res.status(401).json({ error: 'API key requerida' });
    }
    
    if (apiKey !== process.env.API_KEY) {
      console.log('🔐 ❌ API Key incorrecta');
      clearTimeout(timeout);
      return res.status(401).json({ error: 'API key inválida' });
    }
    
    console.log('🔐 ✅ API Key válida');
    clearTimeout(timeout);
    next();
    
  } catch (error) {
    console.log('🔐 🔴 Error en verifyApiKey:', error);
    clearTimeout(timeout);
    next(); 
  }
};

router.post('/data', verifyApiKey, (req, res, next) => {
  console.log('🟢 Ruta /api/sensors/data alcanzada - Ejecutando controller...');
  sensorController.processSensorData(req, res, next);
});

router.get('/latest', sensorController.getLatestReading);

router.get('/history', async (req, res) => {
  try {
    const { limit = 100, hours = 24 } = req.query;

    const supabase = require('../config/database');
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error obteniendo histórico:', error);
      return res.status(500).json({ error: 'Error al obtener histórico' });
    }

    res.json({ 
      data,
      count: data ? data.length : 0
    });

  } catch (error) {
    console.error('Error en /api/sensors/history:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const supabase = require('../config/database');

    const { data, error } = await supabase
      .from('sensor_data')
      .select('temperature, humidity, voltage, current, created_at')
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error obteniendo stats:', error);
      return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }

    if (!data || data.length === 0) {
      return res.json({
        message: 'No hay datos en el período seleccionado',
        data: []
      });
    }

    const stats = {
      temperature: calculateStats(data.map(d => d.temperature)),
      humidity: calculateStats(data.map(d => d.humidity)),
      voltage: calculateStats(data.map(d => d.voltage)),
      current: calculateStats(data.map(d => d.current)),
      total_readings: data.length,
      period_hours: hours
    };

    res.json({
      success: true,
      stats,
      period: `${hours} horas`
    });

  } catch (error) {
    console.error('Error en /api/sensors/stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

function calculateStats(values) {
  if (values.length === 0) return { min: 0, max: 0, avg: 0 };
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  
  return {
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    avg: parseFloat(avg.toFixed(2)),
    count: values.length
  };
}

router.get('/status', async (req, res) => {
  try {
    const supabase = require('../config/database');
    
    const { data: lastReading, error: readingError } = await supabase
      .from('sensor_data')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayReadings, error: countError } = await supabase
      .from('sensor_data')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString());

    if (readingError && readingError.code !== 'PGRST116') {
      console.error('Error obteniendo status:', readingError);
    }

    if (countError) {
      console.error('Error contando lecturas:', countError);
    }

    const status = {
      system: 'online',
      last_reading: lastReading ? lastReading.created_at : null,
      readings_today: todayReadings ? todayReadings.length : 0,
      data_age: lastReading ? 
        Math.round((new Date() - new Date(lastReading.created_at)) / 1000) : null,
      timestamp: new Date().toISOString()
    };

    if (!lastReading) {
      status.system = 'no_data';
      status.message = 'Esperando primera lectura del ESP32';
    } else if (status.data_age > 60) { 
      status.system = 'warning';
      status.message = 'Posible desconexión del ESP32';
    } else {
      status.system = 'online';
      status.message = 'Recibiendo datos normalmente';
    }

    res.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error en /api/sensors/status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;