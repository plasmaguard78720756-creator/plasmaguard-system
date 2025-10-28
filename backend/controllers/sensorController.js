// controllers/sensorController.js - VERSIÓN COMPLETA
const supabase = require('../config/database');

// Función para procesar datos del ESP32
async function processSensorData(req, res) {
  try {
    console.log('🟢 INICIANDO processSensorData...');
    
    const { temperature, humidity, voltage, current } = req.body;

    // Validaciones mejoradas
    if (temperature === undefined || humidity === undefined || 
        voltage === undefined || current === undefined) {
      console.log('🔴 Datos incompletos recibidos:', req.body);
      return res.status(400).json({ 
        error: 'Datos incompletos',
        required: ['temperature', 'humidity', 'voltage', 'current']
      });
    }

    // Validar rangos básicos
    if (temperature < -100 || temperature > 100) {
      return res.status(400).json({ error: 'Temperatura fuera de rango válido' });
    }
    if (humidity < 0 || humidity > 100) {
      return res.status(400).json({ error: 'Humedad fuera de rango válido' });
    }

    console.log('📤 Datos del ESP32 validados:', { temperature, humidity, voltage, current });

    // Guardar en base de datos
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

    // Verificar alertas (no bloqueante)
    console.log('🔍 Verificando alertas...');
    checkAlerts(temperature, humidity, voltage, current)
      .then(() => console.log('✅ Verificación de alertas completada'))
      .catch(err => console.error('🔴 Error en checkAlerts:', err));

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

// FUNCIÓN COMPLETA DE VERIFICACIÓN DE ALERTAS
async function checkAlerts(temperature, humidity, voltage, current) {
  try {
    console.log('   🔍 Ejecutando checkAlerts...');
    
    // Obtener configuraciones del sistema
    const { data: configs, error: configError } = await supabase
      .from('system_config')
      .select('*');

    if (configError) {
      console.error('   🔴 Error obteniendo configs:', configError);
      return;
    }

    // Convertir configs a objeto fácil de usar
    const config = {};
    configs.forEach(item => {
      config[item.key] = parseFloat(item.value) || item.value;
    });

    const alerts = [];

    // 1. ALERTAS DE TEMPERATURA
    if (temperature < config.temp_min || temperature > config.temp_max) {
      alerts.push({
        type: 'temperature',
        message: `Temperatura fuera de rango: ${temperature.toFixed(1)}°C`,
        severity: temperature < config.temp_min - 5 || temperature > config.temp_max + 5 ? 'critical' : 'warning',
        value: temperature,
        threshold: temperature < config.temp_min ? config.temp_min : config.temp_max
      });
    }

    // 2. ALERTAS DE HUMEDAD
    if (humidity > config.humidity_max) {
      alerts.push({
        type: 'humidity',
        message: `Humedad demasiado alta: ${humidity.toFixed(1)}%`,
        severity: humidity > config.humidity_max + 10 ? 'critical' : 'warning',
        value: humidity,
        threshold: config.humidity_max
      });
    }

    // 3. ALERTAS DE VOLTAJE
    if (voltage < config.voltage_min || voltage > config.voltage_max) {
      alerts.push({
        type: 'voltage',
        message: `Voltaje fuera de rango: ${voltage.toFixed(1)}V`,
        severity: 'critical', // El voltaje siempre es crítico
        value: voltage,
        threshold: voltage < config.voltage_min ? config.voltage_min : config.voltage_max
      });
    }

    // 4. ALERTAS DE CORRIENTE
    if (current > config.current_max) {
      alerts.push({
        type: 'current',
        message: `Corriente excedida: ${current.toFixed(2)}A`,
        severity: current > config.current_max * 1.2 ? 'critical' : 'warning',
        value: current,
        threshold: config.current_max
      });
    }

    // 5. ALERTA ESPECIAL: SENSOR DESCONECTADO (valores cero o fuera de rango extremo)
    if ((temperature === 0 && humidity === 0) || 
        (voltage === 0 && current === 0)) {
      alerts.push({
        type: 'system',
        message: 'Posible desconexión de sensores - Valores en cero',
        severity: 'critical',
        value: 0,
        threshold: 0
      });
    }

    // Insertar alertas si hay alguna
    if (alerts.length > 0) {
      console.log(`   🚨 Insertando ${alerts.length} alertas...`);
      const { error: alertError } = await supabase
        .from('alerts')
        .insert(alerts);
      
      if (alertError) {
        console.error('   🔴 Error insertando alertas:', alertError);
      } else {
        console.log(`   ✅ ${alerts.length} alertas generadas:`);
        alerts.forEach(alert => {
          console.log(`      - ${alert.type}: ${alert.message}`);
        });
      }
    } else {
      console.log('   ✅ No hay alertas que generar - Valores normales');
    }

  } catch (error) {
    console.error('   🔴 Error en checkAlerts:', error);
  }
}

// Función para obtener última lectura
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