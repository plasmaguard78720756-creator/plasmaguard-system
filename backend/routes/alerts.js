const express = require('express');
const router = express.Router();
const supabase = require('../config/database');

router.get('/active', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('active_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo alertas:', error);
      return res.status(500).json({ error: 'Error al obtener alertas' });
    }

    res.json({ 
      success: true,
      count: data.length,
      data 
    });

  } catch (error) {
    console.error('Error en /api/alerts/active:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Error obteniendo alertas:', error);
      return res.status(500).json({ error: 'Error al obtener alertas' });
    }

    res.json({ 
      success: true,
      count: data.length,
      data 
    });

  } catch (error) {
    console.error('Error en /api/alerts:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('alerts')
      .update({ 
        acknowledged: true,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error actualizando alerta:', error);
      return res.status(500).json({ error: 'Error al actualizar alerta' });
    }

    res.json({ 
      success: true,
      message: 'Alerta marcada como reconocida',
      data: data[0]
    });

  } catch (error) {
    console.error('Error en /api/alerts/:id/acknowledge:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;