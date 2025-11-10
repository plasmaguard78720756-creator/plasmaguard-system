const supabase = require('../config/database');

// Cache para tracking de alertas recientes
const alertCache = new Map();
const ALERT_COOLDOWN = 300000; // 5 minutos entre alertas similares
const GROUPING_WINDOW = 60000; // 1 minuto para agrupar alertas similares

async function processSensorData(req, res) {
  try {
    console.log('🟢 INICIANDO processSensorData...');
    
    const { temperature, humidity, voltage, current } = req.body;

    if (temperature === undefined || humidity === undefined || 
        voltage === undefined || current === undefined) {
      console.log('🔴 Datos incompletos recibidos:', req.body);
      return res.status(400).json({ 
        error: 'Datos incompletos',
        required: ['temperature', 'humidity', 'voltage', 'current']
      });
    }

    if (temperature < -100 || temperature > 100) {
      return res.status(400).json({ error: 'Temperatura fuera de rango válido' });
    }
    if (humidity < 0 || humidity > 100) {
      return res.status(400).json({ error: 'Humedad fuera de rango válido' });
    }

    console.log('📤 Datos del ESP32 validados:', { temperature, humidity, voltage, current });

    console.log('💾 Guardando en Supabase...');
    const { data, error } = await supabase
      .from('sensor_data')
      .insert([{
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        voltage: parseFloat(voltage),
        current: parseFloat(current)
      }])
      .select();

    if (error) {
      console.error('🔴 Error insertando datos en BD:', error);
      return res.status(500).json({ error: 'Error al guardar datos' });
    }

    console.log('✅ Datos guardados en Supabase - ID:', data[0]?.id);

    console.log('🔍 Verificando alertas inteligentes...');
    checkSmartAlerts(temperature, humidity, voltage, current)
      .then(() => console.log('✅ Verificación de alertas completada'))
      .catch(err => console.error('🔴 Error en checkSmartAlerts:', err));

    res.json({
      success: true,
      message: 'Datos recibidos correctamente',
      data: data[0],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🔴 ERROR CRÍTICO en processSensorData:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function checkSmartAlerts(temperature, humidity, voltage, current) {
  try {
    console.log('   🔍 Ejecutando checkSmartAlerts inteligente...');
    
    const { data: configs, error: configError } = await supabase
      .from('system_config')
      .select('*');

    if (configError) {
      console.error('   🔴 Error obteniendo configs:', configError);
      return;
    }

    const config = {};
    configs.forEach(item => {
      config[item.key] = parseFloat(item.value) || item.value;
    });

    const now = Date.now();
    const alerts = [];
    const alertKey = generateAlertKey(temperature, humidity, voltage, current);

    // Verificar si ya hay una alerta similar reciente
    const lastAlertTime = alertCache.get(alertKey);
    if (lastAlertTime && (now - lastAlertTime) < ALERT_COOLDOWN) {
      console.log('   ⏰ Alerta similar reciente, omitiendo...');
      return;
    }

    // Verificar temperatura
    if (temperature < config.temp_min || temperature > config.temp_max) {
      const severity = getTemperatureSeverity(temperature, config.temp_min, config.temp_max);
      if (shouldCreateAlert('temperature', severity)) {
        alerts.push({
          type: 'temperature',
          message: getTemperatureMessage(temperature, config.temp_min, config.temp_max),
          severity: severity,
          value: temperature,
          threshold: temperature < config.temp_min ? config.temp_min : config.temp_max,
          priority: getPriorityLevel(severity)
        });
      }
    }

    // Verificar humedad
    if (humidity > config.humidity_max) {
      const severity = getHumiditySeverity(humidity, config.humidity_max);
      if (shouldCreateAlert('humidity', severity)) {
        alerts.push({
          type: 'humidity',
          message: `Humedad elevada: ${humidity.toFixed(1)}% (Máx: ${config.humidity_max}%)`,
          severity: severity,
          value: humidity,
          threshold: config.humidity_max,
          priority: getPriorityLevel(severity)
        });
      }
    }

    // Verificar voltaje
    if (voltage < config.voltage_min || voltage > config.voltage_max) {
      const severity = 'critical';
      if (shouldCreateAlert('voltage', severity)) {
        alerts.push({
          type: 'voltage',
          message: `Voltaje fuera de rango: ${voltage.toFixed(1)}V (Rango: ${config.voltage_min}-${config.voltage_max}V)`,
          severity: severity,
          value: voltage,
          threshold: voltage < config.voltage_min ? config.voltage_min : config.voltage_max,
          priority: getPriorityLevel(severity)
        });
      }
    }

    // Verificar corriente
    if (current > config.current_max) {
      const severity = current > config.current_max * 1.2 ? 'critical' : 'warning';
      if (shouldCreateAlert('current', severity)) {
        alerts.push({
          type: 'current',
          message: `Corriente elevada: ${current.toFixed(2)}A (Máx: ${config.current_max}A)`,
          severity: severity,
          value: current,
          threshold: config.current_max,
          priority: getPriorityLevel(severity)
        });
      }
    }

    // Verificar desconexión de sensores
    if ((temperature === 0 && humidity === 0) || (voltage === 0 && current === 0)) {
      const severity = 'critical';
      if (shouldCreateAlert('system', severity)) {
        alerts.push({
          type: 'system',
          message: 'Posible desconexión de sensores - Valores en cero',
          severity: severity,
          value: 0,
          threshold: 0,
          priority: getPriorityLevel(severity)
        });
      }
    }

    if (alerts.length > 0) {
      console.log(`   🚨 Insertando ${alerts.length} alertas inteligentes...`);
      
      // Actualizar cache
      alertCache.set(alertKey, now);
      
      // Limpiar cache antiguo
      cleanupAlertCache();

      const { error: alertError } = await supabase
        .from('alerts')
        .insert(alerts);
      
      if (alertError) {
        console.error('   🔴 Error insertando alertas:', alertError);
      } else {
        console.log(`   ✅ ${alerts.length} alertas generadas inteligentemente:`);
        alerts.forEach(alert => {
          console.log(`      - ${alert.type} [${alert.severity}]: ${alert.message}`);
        });
      }
    } else {
      console.log('   ✅ No hay alertas críticas que generar');
    }

  } catch (error) {
    console.error('   🔴 Error en checkSmartAlerts:', error);
  }
}

// Funciones auxiliares para alertas inteligentes
function generateAlertKey(temperature, humidity, voltage, current) {
  // Generar clave única basada en los valores de los sensores
  return `temp:${temperature.toFixed(1)}_hum:${humidity.toFixed(1)}_volt:${voltage.toFixed(1)}_curr:${current.toFixed(2)}`;
}

function getTemperatureSeverity(temperature, min, max) {
  const optimalMin = -30;
  const optimalMax = -20;
  
  if (temperature < min - 5 || temperature > max + 5) {
    return 'critical';
  } else if (temperature < optimalMin || temperature > optimalMax) {
    return 'warning';
  }
  return 'info';
}

function getTemperatureMessage(temperature, min, max) {
  if (temperature < min) {
    return `Temperatura muy baja: ${temperature.toFixed(1)}°C (Mín: ${min}°C)`;
  } else if (temperature > max) {
    return `Temperatura muy alta: ${temperature.toFixed(1)}°C (Máx: ${max}°C)`;
  } else if (temperature < -30) {
    return `Temperatura baja: ${temperature.toFixed(1)}°C (Óptimo: -25°C a -35°C)`;
  } else {
    return `Temperatura alta: ${temperature.toFixed(1)}°C (Óptimo: -25°C a -35°C)`;
  }
}

function getHumiditySeverity(humidity, max) {
  if (humidity > max + 15) return 'critical';
  if (humidity > max + 5) return 'warning';
  return 'info';
}

function getPriorityLevel(severity) {
  const priorities = {
    'critical': 1,
    'warning': 2,
    'info': 3
  };
  return priorities[severity] || 3;
}

function shouldCreateAlert(type, severity) {
  // No crear alertas de tipo "info" para evitar spam
  if (severity === 'info') return false;
  
  // Verificar si hay una alerta similar reciente del mismo tipo
  const now = Date.now();
  const typeKey = `${type}_${severity}`;
  const lastAlertTime = alertCache.get(typeKey);
  
  if (lastAlertTime && (now - lastAlertTime) < ALERT_COOLDOWN) {
    return false;
  }
  
  // Actualizar cache para este tipo
  alertCache.set(typeKey, now);
  return true;
}

function cleanupAlertCache() {
  const now = Date.now();
  const oneHour = 3600000; // 1 hora
  
  for (const [key, timestamp] of alertCache.entries()) {
    if (now - timestamp > oneHour) {
      alertCache.delete(key);
    }
  }
}

async function getLatestReading(req, res) {
  try {
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.json({
        data: {
          temperature: 0, humidity: 0, voltage: 0, current: 0, power: 0,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString()
        },
        message: 'Esperando datos del ESP32...',
        empty: true
      });
    }

    res.json({ data: data[0], message: 'Datos encontrados' });

  } catch (error) {
    console.error('Error en getLatestReading:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
}

module.exports = {
  processSensorData,
  getLatestReading
};