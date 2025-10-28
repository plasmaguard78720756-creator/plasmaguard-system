// backend/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(auth);

// GET: Obtener todos los usuarios (solo admin)
router.get('/', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Solo administradores pueden ver usuarios.'
    });
  }
  next();
}, userController.getAllUsers);

// POST: Crear nuevo usuario (solo admin)
router.post('/', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Solo administradores pueden crear usuarios.'
    });
  }
  next();
}, userController.createUser);

// PUT: Actualizar usuario (solo admin)
router.put('/:id', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Solo administradores pueden actualizar usuarios.'
    });
  }
  next();
}, userController.updateUser);

// DELETE: Eliminar usuario (solo admin)
router.delete('/:id', (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado. Solo administradores pueden eliminar usuarios.'
    });
  }
  next();
}, userController.deleteUser);

module.exports = router;