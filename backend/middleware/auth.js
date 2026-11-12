const jwt = require('jsonwebtoken');

// Protege rutas de administrador. El frontend envía:
//   Authorization: Bearer <token>
module.exports = function requireAdmin(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) return res.status(401).json({ mensaje: 'No autorizado' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET); // lanza error si es falso o expiró
    next();
  } catch {
    res.status(401).json({ mensaje: 'Sesión inválida o expirada' });
  }
};
