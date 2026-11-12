const mongoose = require('mongoose');

const CitaSchema = new mongoose.Schema({
  nombreCliente: {
    type: String,
    required: [true, 'El nombre del cliente es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    trim: true,
    lowercase: true
  },
  telefono: {
    type: String,
    trim: true
  },
  plan: {
    type: String,
    required: [true, 'Debes seleccionar un plan'],
    enum: ['duo', 'amigos', 'familia']
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha y hora son obligatorias']
  },
  personas: {
    type: Number,
    required: true,
    min: 1
  },
  notas: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmada', 'cancelada'],
    default: 'pendiente'
  }
}, { timestamps: true });

module.exports = mongoose.model('Cita', CitaSchema);