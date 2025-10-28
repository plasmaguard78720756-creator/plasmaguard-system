const express = require('express');
const router = express.Router();
const supabase = require('../config/database');

// GET: Obtener estado actual del control
router.get('/status', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('system_control')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error obteniendo control:', error);
      return res.status(500).json({ error: 'Error al obtener estado de control' });
    }

    if (!data) {
      const { data: newData, error: insertError } = await supabase
        .from('system_control')
        .insert([
          {
            operation_mode: 'auto',
            simulated_temperature: -25.0,
            simulated_humidity: 45.0,
            simulated_voltage: 220.0,
            simulated_current: 2.0,
            manual_light1: false,
            manual_light2: false
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('Error creando control:', insertError);
        return res.status(500).json({ error: 'Error al crear configuración de control' });
      }

      return res.json(newData);
    }

    res.json(data);

  } catch (error) {
    console.error('Error en /api/control/status:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST: Actualizar modo de operación
router.post('/mode', async (req, res) => {
  try {
    const { operation_mode, user_id } = req.body;

    if (!operation_mode || !['auto', 'manual', 'simulation'].includes(operation_mode)) {
      return res.status(400).json({ error: 'Modo de operación inválido. Use: auto, manual o simulation' });
    }

    const { data, error } = await supabase
      .from('system_control')
      .update({
        operation_mode,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)  // CLAÚSULA WHERE AGREGADA
      .select()
      .single();

    if (error) {
      console.error('Error actualizando modo:', error);
      return res.status(500).json({ error: 'Error al actualizar modo de operación' });
    }

    res.json({
      success: true,
      message: `Modo cambiado a: ${operation_mode}`,
      data
    });

  } catch (error) {
    console.error('Error en /api/control/mode:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST: Control manual de focos
router.post('/manual-lights', async (req, res) => {
  try {
    const { manual_light1, manual_light2, user_id } = req.body;

    // Validar que estemos en modo manual
    const { data: currentMode } = await supabase
      .from('system_control')
      .select('operation_mode')
      .single();

    if (currentMode.operation_mode !== 'manual') {
      return res.status(400).json({ error: 'Solo se puede controlar focos en modo manual' });
    }

    const { data, error } = await supabase
      .from('system_control')
      .update({
        manual_light1: manual_light1 !== undefined ? manual_light1 : false,
        manual_light2: manual_light2 !== undefined ? manual_light2 : false,
        updated_by: user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)  // CLAÚSULA WHERE AGREGADA
      .select()
      .single();

    if (error) {
      console.error('Error actualizando focos:', error);
      return res.status(500).json({ error: 'Error al controlar focos' });
    }

    res.json({
      success: true,
      message: 'Focos actualizados',
      data
    });

  } catch (error) {
    console.error('Error en /api/control/manual-lights:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST: Configurar datos de simulación
router.post('/simulation-data', async (req, res) => {
  try {
    const { 
      simulated_temperature, 
      simulated_humidity, 
      simulated_voltage, 
      simulated_current,
      user_id 
    } = req.body;

    // Validar que estemos en modo simulación
    const { data: currentMode } = await supabase
      .from('system_control')
      .select('operation_mode')
      .single();

    if (currentMode.operation_mode !== 'simulation') {
      return res.status(400).json({ error: 'Solo se pueden configurar datos en modo simulación' });
    }

    const updateData = {
      updated_by: user_id,
      updated_at: new Date().toISOString()
    };

    if (simulated_temperature !== undefined) updateData.simulated_temperature = simulated_temperature;
    if (simulated_humidity !== undefined) updateData.simulated_humidity = simulated_humidity;
    if (simulated_voltage !== undefined) updateData.simulated_voltage = simulated_voltage;
    if (simulated_current !== undefined) updateData.simulated_current = simulated_current;

    const { data, error } = await supabase
      .from('system_control')
      .update(updateData)
      .eq('id', 1)  // CLAÚSULA WHERE AGREGADA
      .select()
      .single();

    if (error) {
      console.error('Error actualizando simulación:', error);
      return res.status(500).json({ error: 'Error al configurar datos de simulación' });
    }

    res.json({
      success: true,
      message: 'Datos de simulación actualizados',
      data
    });

  } catch (error) {
    console.error('Error en /api/control/simulation-data:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;