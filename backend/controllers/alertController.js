const supabase = require('../config/database');
const nodemailer = require('nodemailer');

// Configuración de email (usando Gmail como ejemplo)
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

class AlertController {
  
  // Obtener alertas activas con filtros inteligentes
  async getActiveAlerts(req, res) {
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

      const { data: alerts, error } = await query;

      if (error) {
        console.error('Error obteniendo alertas activas:', error);
        return res.status(500).json({ 
          success: false,
          error: 'Error al obtener alertas' 
        });
      }

      // Agrupar alertas similares (mismo tipo y severidad en los últimos 30 minutos)
      const groupedAlerts = this.groupSimilarAlerts(alerts);

      res.json({
        success: true,
        data: groupedAlerts,
        count: groupedAlerts.length,
        stats: this.calculateAlertStats(groupedAlerts)
      });

    } catch (error) {
      console.error('Error en getActiveAlerts:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Obtener todas las alertas (para histórico)
  async getAllAlerts(req, res) {
    try {
      const { limit = 100, page = 1, severity, type } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase
        .from('alerts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit) - 1);

      if (severity) query = query.eq('severity', severity);
      if (type) query = query.eq('type', type);

      const { data: alerts, error, count } = await query;

      if (error) {
        console.error('Error obteniendo alertas:', error);
        return res.status(500).json({ 
          success: false,
          error: 'Error al obtener alertas' 
        });
      }

      res.json({
        success: true,
        data: alerts,
        count: alerts.length,
        total: count,
        page: parseInt(page),
        totalPages: Math.ceil(count / limit)
      });

    } catch (error) {
      console.error('Error en getAllAlerts:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Marcar alerta como reconocida
  async acknowledgeAlert(req, res) {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      const { data: alert, error } = await supabase
        .from('alerts')
        .update({ 
          acknowledged: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user_id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando alerta:', error);
        return res.status(500).json({ 
          success: false,
          error: 'Error al actualizar alerta' 
        });
      }

      if (!alert) {
        return res.status(404).json({ 
          success: false,
          error: 'Alerta no encontrada' 
        });
      }

      res.json({
        success: true,
        message: 'Alerta marcada como reconocida',
        data: alert
      });

    } catch (error) {
      console.error('Error en acknowledgeAlert:', error);
      res.status(500).json({ 
        success: false,
        error: 'Error interno del servidor' 
      });
    }
  }

  // Enviar reporte por email (OPCIONAL)
  async sendEmailReport(req, res) {
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

      // Construir el email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: destinatarios.join(', '),
        subject: asunto || `Reporte de Falla - PlasmaGuard #${reporteId}`,
        html: this.buildEmailTemplate(reporte, mensaje)
      };

      // Enviar email
      const info = await emailTransporter.sendMail(mailOptions);

      console.log('✅ Email enviado:', info.messageId);

      res.json({
        success: true,
        message: 'Reporte enviado por email correctamente',
        messageId: info.messageId
      });

    } catch (error) {
      console.error('Error enviando email:', error);
      res.status(500).json({
        success: false,
        error: 'Error al enviar el email',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Métodos auxiliares

  // Agrupar alertas similares
  groupSimilarAlerts(alerts) {
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
  calculateAlertStats(alerts) {
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

  // Construir template de email
  buildEmailTemplate(reporte, mensajePersonalizado) {
    const falla = reporte.fallas_globales;
    const operador = reporte.users;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 20px; border-radius: 0 0 10px 10px; }
          .alert-critical { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 10px 0; }
          .alert-warning { background: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 PLASMAGUARD - Reporte de Falla</h1>
            <p>Sistema de Monitoreo de Plasma Fresco Congelado</p>
          </div>
          
          <div class="content">
            <div class="${falla?.severidad === 'critical' ? 'alert-critical' : 'alert-warning'}">
              <h2>Reporte #${reporte.id}</h2>
              <p><strong>Falla:</strong> ${falla?.tipo || 'No especificada'}</p>
              <p><strong>Severidad:</strong> ${falla?.severidad || 'No especificada'}</p>
              <p><strong>Reportado por:</strong> ${operador?.name || 'Operador'} (${operador?.email || 'N/A'})</p>
              <p><strong>Fecha:</strong> ${new Date(reporte.fecha_envio).toLocaleString()}</p>
            </div>

            <div style="margin: 20px 0;">
              <h3>📋 Observaciones del Operador</h3>
              <p>${reporte.observaciones || 'No se proporcionaron observaciones adicionales.'}</p>
            </div>

            ${mensajePersonalizado ? `
            <div style="background: #dbeafe; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h4>💬 Mensaje Adicional</h4>
              <p>${mensajePersonalizado}</p>
            </div>
            ` : ''}

            <div style="background: white; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb;">
              <h3>🔧 Acción Requerida</h3>
              <p>Por favor revise este reporte en el sistema PlasmaGuard y tome las acciones necesarias.</p>
              <p><strong>Prioridad:</strong> ${falla?.severidad === 'critical' ? 'ALTA - Atención inmediata requerida' : 'MEDIA - Revisar en las próximas horas'}</p>
            </div>
          </div>

          <div class="footer">
            <p>Este es un mensaje automático del Sistema PlasmaGuard.</p>
            <p>No responda a este email. Para más información, acceda al sistema.</p>
            <p>© 2024 PlasmaGuard - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new AlertController();