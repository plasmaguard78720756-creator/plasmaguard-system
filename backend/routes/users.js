const express = require('express');
const router = express.Router();
const supabase = require('../config/database');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'No tienes permisos para acceder a esta función' 
      });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, ci, active, institucion, celular, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Error al obtener usuarios' 
      });
    }

    res.json({
      success: true,
      data: users,
      count: users.length
    });

  } catch (error) {
    console.error('Error en /api/users:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'No tienes permisos para crear usuarios' 
      });
    }

    const { name, email, password, role, ci, institucion, celular } = req.body;

    if (!name || !email || !password || !role || !ci) {
      return res.status(400).json({
        success: false,
        error: 'Faltan campos requeridos'
      });
    }

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

    const hashedPassword = await bcrypt.hash(password, 10);

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
        active: true
      }])
      .select('id, name, email, role, ci, active, institucion, celular, created_at')
      .single();

    if (insertError) {
      console.error('Error creando usuario:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Error al crear usuario: ' + insertError.message
      });
    }

    res.json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: newUser
    });

  } catch (error) {
    console.error('Error en /api/users POST:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'No tienes permisos para actualizar usuarios' 
      });
    }

    const { id } = req.params;
    const { name, email, role, ci, institucion, celular, active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (ci !== undefined) updateData.ci = ci;
    if (institucion !== undefined) updateData.institucion = institucion;
    if (celular !== undefined) updateData.celular = celular;
    if (active !== undefined) updateData.active = active;

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, role, ci, active, institucion, celular, created_at')
      .single();

    if (error) {
      console.error('Error actualizando usuario:', error);
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

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: updatedUser
    });

  } catch (error) {
    console.error('Error en /api/users PUT:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false,
        error: 'No tienes permisos para eliminar usuarios' 
      });
    }

    const { id } = req.params;

    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single();

    if (user?.role === 'admin') {
      const { data: adminCount } = await supabase
        .from('users')
        .select('id', { count: 'exact' })
        .eq('role', 'admin')
        .eq('active', true);

      if (adminCount.length <= 1) {
        return res.status(400).json({
          success: false,
          error: 'No se puede eliminar el último administrador activo'
        });
      }
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando usuario:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al eliminar usuario: ' + error.message
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en /api/users DELETE:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router;