const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const alertController = require('../controllers/alertController');

// Obtener alertas activas (CON AGRUPACIÓN INTELIGENTE)
router.get('/active', async (req, res) => {
  try {
    const { severity, type, hours = 24, limit = 50 } = req.query;
    
    let query = supabase
      .from('alerts')
      .select('*')
      .eq('acknowledged', false)
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    // Aplicar filtros si existen
    if (severity) {
      query = query.eq('severity', severity);
    }
    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error obteniendo alertas:', error);
      return res.status(500).json({ error: 'Error al obtener alertas' });
    }

    // Agrupar alertas similares (mismo tipo y severidad en los últimos 30 minutos)
    const groupedAlerts = groupSimilarAlerts(data);

    res.json({ 
      success: true,
      count: groupedAlerts.length,
      data: groupedAlerts,
      stats: calculateAlertStats(groupedAlerts)
    });

  } catch (error) {
    console.error('Error en /api/alerts/active:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener todas las alertas (histórico)
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

// Marcar alerta como reconocida
router.post('/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;
    
    const { data, error } = await supabase
      .from('alerts')
      .update({ 
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: user_id
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

// Enviar reporte por email (NUEVA RUTA OPCIONAL)
router.post('/send-email-report', async (req, res) => {
  try {
    const { reporteId, destinatarios, asunto, mensaje } = req.body;

    // Verificar si el email está configurado
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(400).json({
        success: false,
        error: 'Servicio de email no configurado',
        message: 'Configure las variables de entorno EMAIL_USER y EMAIL_PASS'
      });
    }

    // Obtener datos del reporte
    const { data: reporte, error } = await supabase
      .from('reportes_operadores')
      .select(`
        *,
        fallas_globales (*),
        users!reportes_operadores_operador_id_fkey (name, email)
      `)
      .eq('id', reporteId)
      .single();

    if (error || !reporte) {
      return res.status(404).json({
        success: false,
        error: 'Reporte no encontrado'
      });
    }

    // Construir y enviar email (aquí iría la lógica de nodemailer)
    // Por ahora simulamos el envío
    console.log('📧 Simulando envío de email para reporte:', reporteId);
    
    res.json({
      success: true,
      message: 'Reporte enviado por email correctamente (simulación)',
      reporteId: reporteId
    });

  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar el email'
    });
  }
});

// Funciones auxiliares para agrupación inteligente

// Agrupar alertas similares
function groupSimilarAlerts(alerts) {
  const groups = new Map();
  const thirtyMinutes = 30 * 60 * 1000;

  alerts.forEach(alert => {
    const key = `${alert.type}_${alert.severity}`;
    const existingGroup = groups.get(key);
    
    if (existingGroup) {
      // Verificar si la alerta es similar y reciente
      const lastAlert = existingGroup[existingGroup.length - 1];
      const timeDiff = new Date(alert.created_at) - new Date(lastAlert.created_at);
      
      if (timeDiff < thirtyMinutes) {
        // Agrupar alertas similares
        existingGroup.push(alert);
      } else {
        // Crear nuevo grupo
        groups.set(key, [alert]);
      }
    } else {
      groups.set(key, [alert]);
    }
  });

  // Devolver solo la alerta más reciente de cada grupo
  const result = [];
  for (const [key, groupAlerts] of groups) {
    const latestAlert = groupAlerts[0]; // Ya están ordenadas por fecha descendente
    if (groupAlerts.length > 1) {
      latestAlert.grouped_count = groupAlerts.length;
      latestAlert.message = `${latestAlert.message} (${groupAlerts.length} ocurrencias similares)`;
    }
    result.push(latestAlert);
  }

  return result.sort((a, b) => (a.priority || 3) - (b.priority || 3));
}

// Calcular estadísticas de alertas
function calculateAlertStats(alerts) {
  const stats = {
    total: alerts.length,
    critical: 0,
    warning: 0,
    byType: {},
    lastAlert: null
  };

  alerts.forEach(alert => {
    // Contar por severidad
    if (alert.severity === 'critical') stats.critical++;
    if (alert.severity === 'warning') stats.warning++;

    // Contar por tipo
    stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;

    // Última alerta
    if (!stats.lastAlert || new Date(alert.created_at) > new Date(stats.lastAlert)) {
      stats.lastAlert = alert.created_at;
    }
  });

  return stats;
}

module.exports = router;