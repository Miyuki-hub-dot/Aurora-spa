const mongoose = require('mongoose');

// "Lista blanca": copia SOLO los campos permitidos del body.
// Evita que alguien envíe campos que no debe (ej: estado: 'confirmada').
const pick = (obj = {}, campos) =>
  Object.fromEntries(campos.filter(c => obj[c] !== undefined).map(c => [c, obj[c]]));

// Convierte errores de Mongoose en un mensaje legible para el usuario
function mensajeError(error) {
  if (error.code === 11000) return 'Ya existe un registro con ese valor único (slug)';
  if (error.name === 'ValidationError') return Object.values(error.errors).map(e => e.message).join('. ');
  return error.message;
}

// Middleware: rechaza IDs que no sean ObjectId válidos (evita errores raros de Mongo)
function validarId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ mensaje: 'ID inválido' });
  next();
}

module.exports = { pick, mensajeError, validarId };
