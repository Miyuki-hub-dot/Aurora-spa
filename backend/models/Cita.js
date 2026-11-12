const mongoose = require('mongoose');

const CitaSchema = new mongoose.Schema({
  nombreCliente: {
    type: String,
    required: [true, 'El nombre del cliente es obligatorio'],
    trim: true,
    maxlength: [100, 'El nombre es demasiado largo']
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    trim: true,
    lowercase: true,
    // NUEVO: antes cualquier texto se aceptaba como email
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El correo no es válido']
  },
  telefono: { type: String, trim: true, maxlength: 30 },
  // CORREGIDO: se quitó el enum ['duo','amigos','familia']. Si el admin crea un
  // plan nuevo, el enum lo rechazaría. Ahora la ruta valida contra la colección Plan.
  plan: {
    type: String,
    required: [true, 'Debes seleccionar un plan'],
    trim: true
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha y hora son obligatorias']
  },
  personas: {
    type: Number,
    required: [true, 'Indica cuántas personas asistirán'],
    min: [1, 'Debe asistir al menos 1 persona']
  },
  notas: { type: String, trim: true, maxlength: [500, 'El mensaje es demasiado largo'] },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada'],
    default: 'pendiente'
  }
}, { timestamps: true });

module.exports = mongoose.model('Cita', CitaSchema);
