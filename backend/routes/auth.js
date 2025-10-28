// backend/routes/auth.js - COMPLETO
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

// POST: Login de usuario
router.post('/login', authController.login);

// POST: Registro de usuario
router.post('/register', authController.register);

// GET: Verificar token
router.get('/verify', auth, authController.verifyToken);

// GET: Obtener perfil (requiere autenticación)
router.get('/profile', auth, authController.getProfile);

module.exports = router;