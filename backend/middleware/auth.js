const jwt = require('jsonwebtoken');
const supabase = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado. Token no proporcionado.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, active, ci')
      .eq('id', decoded.id)
      .eq('active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Token inválido. Usuario no encontrado o inactivo.' 
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('🔴 Error en middleware de autenticación:', error);
    res.status(401).json({ 
      error: 'Token inválido o expirado.' 
    });
  }
};

module.exports = { auth };