// backend/controllers/authController.js - COMPLETO Y CORREGIDO
const supabase = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Función para login de usuarios
async function login(req, res) {
  try {
    const { email, password } = req.body;

    console.log('🔐 Intentando login para:', email);

    // Buscar usuario por email O por CI
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${email},ci.eq.${email}`)
      .eq('active', true)
      .single();

    if (error || !user) {
      console.log('🔴 Usuario no encontrado');
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('🔴 Contraseña incorrecta');
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`✅ Login exitoso: ${user.name} (${user.role})`);

    // Responder con token y datos del usuario (sin password)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ci: user.ci
    };

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('🔴 Error en login:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
}

// Función para registro de usuarios
async function register(req, res) {
  try {
    const { 
      name, email, password, role, ci, 
      fecha_nacimiento, institucion, celular, direccion 
    } = req.body;

    console.log('📝 Registrando nuevo usuario:', email);

    // Validar campos requeridos
    if (!name || !email || !password || !role || !ci) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos'
      });
    }

    // Validar que el email no exista
    const { data: existingEmail, error: emailError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Validar que el CI no exista
    const { data: existingCI, error: ciError } = await supabase
      .from('users')
      .select('id')
      .eq('ci', ci)
      .single();

    if (existingCI) {
      return res.status(400).json({
        success: false,
        error: 'El CI ya está registrado'
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Preparar datos para insertar
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      ci,
      active: true
    };

    // Agregar campos opcionales si existen
    if (fecha_nacimiento) userData.fecha_nacimiento = fecha_nacimiento;
    if (institucion) userData.institucion = institucion;
    if (celular) userData.celular = celular;
    if (direccion) userData.direccion = direccion;

    // Insertar nuevo usuario
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (insertError) {
      console.error('🔴 Error insertando usuario:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Error al crear usuario: ' + insertError.message
      });
    }

    console.log('✅ Usuario registrado exitosamente:', newUser.email);

    // No enviar password en la respuesta
    const { password: _, ...userWithoutPassword } = newUser;

    res.json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('🔴 Error en registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
}

// Función para verificar token
async function verifyToken(req, res) {
  try {
    // El middleware de auth ya verificó el token y agregó el usuario a req.user
    res.json({
      success: true,
      valid: true,
      user: req.user
    });

  } catch (error) {
    console.error('🔴 Error verificando token:', error);
    res.status(401).json({ 
      success: false,
      valid: false,
      error: 'Token inválido' 
    });
  }
}

// Función para obtener perfil
async function getProfile(req, res) {
  try {
    res.json({
      success: true,
      user: req.user
    });

  } catch (error) {
    console.error('🔴 Error obteniendo perfil:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
}

// Exportar todas las funciones
module.exports = {
  login,
  register,
  verifyToken,
  getProfile
};