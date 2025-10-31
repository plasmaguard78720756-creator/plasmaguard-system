const supabase = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    console.log('🔐 Intentando login para:', email);

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

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log('🔴 Contraseña incorrecta');
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales inválidas' 
      });
    }

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

async function register(req, res) {
  try {
    const { 
      name, email, password, role, ci, 
      fecha_nacimiento, institucion, celular, direccion 
    } = req.body;

    console.log('📝 Registrando nuevo usuario:', email);

    if (!name || !email || !password || !role || !ci) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos'
      });
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
      ci,
      active: true
    };

    if (fecha_nacimiento) userData.fecha_nacimiento = fecha_nacimiento;
    if (institucion) userData.institucion = institucion;
    if (celular) userData.celular = celular;
    if (direccion) userData.direccion = direccion;

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

async function verifyToken(req, res) {
  try {
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

module.exports = {
  login,
  register,
  verifyToken,
  getProfile
};