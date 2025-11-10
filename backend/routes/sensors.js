const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const sensorController = require('../controllers/sensorController');

// Ruta para recibir datos del ESP32
router.post('/data', sensorController.processSensorData);

// Obtener última lectura
router.get('/latest', sensorController.getLatestReading);

// Obtener histórico de datos (NUEVA RUTA MEJORADA)
router.get('/history', async (req, res) => {
  try {
    const { 
      hours = 24, 
      days, 
      limit = 100,
      sensor,
      start_date,
      end_date
    } = req.query;

    let query = supabase
      .from('sensor_data')
      .select('*')
      .order('created_at', { ascending: true });

    // Calcular fecha de inicio basada en horas o días
    let startDate = new Date();
    if (days) {
      startDate.setDate(startDate.getDate() - parseInt(days));
    } else {
      startDate.setHours(startDate.getHours() - parseInt(hours));
    }

    query = query.gte('created_at', startDate.toISOString());

    // Filtro por fechas específicas si se proporcionan
    if (start_date && end_date) {
      query = query
        .gte('created_at', new Date(start_date).toISOString())
        .lte('created_at', new Date(end_date).toISOString());
    }

    // Limitar resultados
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo histórico:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error al obtener histórico de datos' 
      });
    }

    // Calcular estadísticas si se solicita
    const stats = calculateSensorStats(data);

    res.json({
      success: true,
      data: data,
      count: data.length,
      stats: stats,
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        hours: parseInt(hours),
        days: days ? parseInt(days) : null
      }
    });

  } catch (error) {
    console.error('Error en /api/sensors/history:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// Obtener estadísticas de sensores (NUEVA RUTA)
router.get('/stats', async (req, res) => {
  try {
    const { hours = 24, days } = req.query;

    let startDate = new Date();
    if (days) {
      startDate.setDate(startDate.getDate() - parseInt(days));
    } else {
      startDate.setHours(startDate.getHours() - parseInt(hours));
    }

    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error obteniendo stats:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error al obtener estadísticas' 
      });
    }

    const stats = calculateSensorStats(data);

    res.json({
      success: true,
      stats: stats,
      period: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        hours: parseInt(hours),
        days: days ? parseInt(days) : null
      },
      summary: {
        total_readings: data.length,
        data_density: calculateDataDensity(data, hours)
      }
    });

  } catch (error) {
    console.error('Error en /api/sensors/stats:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// Función para calcular estadísticas de sensores
function calculateSensorStats(data) {
  if (!data || data.length === 0) {
    return {
      temperature: { min: 0, max: 0, avg: 0, current: 0 },
      humidity: { min: 0, max: 0, avg: 0, current: 0 },
      voltage: { min: 0, max: 0, avg: 0, current: 0 },
      current: { min: 0, max: 0, avg: 0, current: 0 }
    };
  }

  const stats = {
    temperature: calculateSensorStatsForType(data, 'temperature', '°C'),
    humidity: calculateSensorStatsForType(data, 'humidity', '%'),
    voltage: calculateSensorStatsForType(data, 'voltage', 'V'),
    current: calculateSensorStatsForType(data, 'current', 'A')
  };

  return stats;
}

function calculateSensorStatsForType(data, type, unit) {
  const values = data.map(item => item[type]).filter(val => val != null);
  
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0, current: 0, unit };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const current = values[values.length - 1];

  // Calcular tendencia
  const recentValues = values.slice(-10); // Últimas 10 lecturas
  const trend = recentValues.length >= 2 
    ? recentValues[recentValues.length - 1] - recentValues[0]
    : 0;

  return {
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    avg: parseFloat(avg.toFixed(2)),
    current: parseFloat(current.toFixed(2)),
    trend: parseFloat(trend.toFixed(2)),
    unit,
    readings: values.length
  };
}

function calculateDataDensity(data, hours) {
  if (!data || data.length === 0) return 'low';
  
  const readingsPerHour = data.length / parseInt(hours);
  
  if (readingsPerHour >= 10) return 'high';
  if (readingsPerHour >= 5) return 'medium';
  return 'low';
}

module.exports = router;