const mongoose = require('mongoose');

// NUEVO: los planes ahora viven en la base de datos (antes estaban escritos
// a mano en el HTML). Así el admin puede crearlos, editarlos o apagarlos.
const PlanSchema = new mongoose.Schema({
  slug: { type: String, required: [true, 'El slug es obligatorio'], unique: true, trim: true, lowercase: true },
  nombre: { type: String, required: [true, 'El nombre es obligatorio'], trim: true },
  precio: { type: Number, required: [true, 'El precio es obligatorio'], min: [0, 'El precio no puede ser negativo'] },
  personasTexto: { type: String, required: [true, 'Indica para cuántas personas es'], trim: true }, // "2 personas"
  maxPersonas: { type: Number, required: [true, 'Indica el máximo de personas'], min: 1 },
  duracion: { type: String, required: [true, 'La duración es obligatoria'], trim: true },
  incluye: { type: [String], default: [] },
  destacado: { type: Boolean, default: false },
  activo: { type: Boolean, default: true } // false = oculto al público sin borrarlo
}, { timestamps: true });

module.exports = mongoose.model('Plan', PlanSchema);
