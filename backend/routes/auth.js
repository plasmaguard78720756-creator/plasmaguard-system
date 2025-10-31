const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/login', authController.login);

router.post('/register', authController.register);

router.get('/verify', auth, authController.verifyToken);

router.get('/profile', auth, authController.getProfile);

module.exports = router;