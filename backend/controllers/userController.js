// backend/controllers/userController.js
const supabase = require('../config/database');

// Obtener todos los usuarios
async function getAllUsers(req, res) {
  try {
    console.log('📋 Obteniendo lista de usuarios...');

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, ci, active, created_at, institucion, celular')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('🔴 Error obteniendo usuarios:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error al obtener usuarios: ' + error.message 
      });
    }

    console.log(`✅ ${users.length} usuarios obtenidos`);
    
    res.json({
      success: true,
      users: users || [],
      count: users ? users.length : 0
    });

  } catch (error) {
    console.error('🔴 Error en getAllUsers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor: ' + error.message 
    });
  }
}

// Crear nuevo usuario
async function createUser(req, res) {
  try {
    const { name, email, password, role, ci, institucion, celular, direccion } = req.body;

    console.log('➕ Creando nuevo usuario:', email);

    // Validaciones básicas
    if (!name || !email || !password || !role || !ci) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos: name, email, password, role, ci'
      });
    }

    // Verificar si el email ya existe
    const { data: existingEmail } = await supabase
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

    // Verificar si el CI ya existe
    const { data: existingCI } = await supabase
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
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        password: hashedPassword,
        role,
        ci,
        institucion: institucion || null,
        celular: celular || null,
        direccion: direccion || null,
        active: true
      }])
      .select('id, name, email, role, ci, active, created_at, institucion, celular')
      .single();

    if (insertError) {
      console.error('🔴 Error creando usuario:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Error al crear usuario: ' + insertError.message
      });
    }

    console.log('✅ Usuario creado exitosamente:', newUser.email);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: newUser
    });

  } catch (error) {
    console.error('🔴 Error en createUser:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
}

// Actualizar usuario
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, role, ci, institucion, celular, direccion, active } = req.body;

    console.log('✏️ Actualizando usuario ID:', id);

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (ci !== undefined) updateData.ci = ci;
    if (institucion !== undefined) updateData.institucion = institucion;
    if (celular !== undefined) updateData.celular = celular;
    if (direccion !== undefined) updateData.direccion = direccion;
    if (active !== undefined) updateData.active = active;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, role, ci, active, created_at, institucion, celular')
      .single();

    if (error) {
      console.error('🔴 Error actualizando usuario:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al actualizar usuario: ' + error.message
      });
    }

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    console.log('✅ Usuario actualizado:', updatedUser.email);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    });

  } catch (error) {
    console.error('🔴 Error en updateUser:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
}

// Eliminar usuario
async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    console.log('🗑️ Eliminando usuario ID:', id);

    // Verificar que el usuario existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Eliminar usuario (o marcar como inactivo)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('🔴 Error eliminando usuario:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al eliminar usuario: ' + error.message
      });
    }

    console.log('✅ Usuario eliminado:', existingUser.email);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('🔴 Error en deleteUser:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor: ' + error.message
    });
  }
}

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};