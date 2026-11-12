const mongoose = require('mongoose');

// Guardamos el HASH de la contraseña, nunca la contraseña en texto plano.
const AdminSchema = new mongoose.Schema({
  usuario: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
