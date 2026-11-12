const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Admin = require('../models/Admin');

const router = express.Router();

// Máximo 10 intentos de login cada 15 min por IP (frena ataques de fuerza bruta)
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { mensaje: 'Demasiados intentos. Espera 15 minutos.' }
});

// POST /api/auth/login  { usuario, password } → { token }
router.post('/login', limitarLogin, async (req, res) => {
  try {
    const usuario = String(req.body.usuario ?? '').trim();
    const password = String(req.body.password ?? '');

    const admin = await Admin.findOne({ usuario });
    const correcto = admin && await bcrypt.compare(password, admin.passwordHash);

    // Mismo mensaje si falla el usuario o la clave: no ayudamos a adivinar usuarios
    if (!correcto) return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign({ id: admin._id, usuario: admin.usuario }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al iniciar sesión' });
  }
});

module.exports = router;
