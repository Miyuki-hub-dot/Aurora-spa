const express = require('express');
const rateLimit = require('express-rate-limit');
const Cita = require('../models/Cita');
const Plan = require('../models/Plan');
const requireAdmin = require('../middleware/auth');
const { pick, mensajeError, validarId } = require('../utils/helpers');

const router = express.Router();

// Campos que el PÚBLICO puede enviar. "estado" NO está: solo el admin lo cambia.
const CAMPOS_PUBLICOS = ['nombreCliente', 'email', 'telefono', 'plan', 'fecha', 'personas', 'notas'];

// NUEVO: máximo 10 solicitudes por hora por IP (anti-spam)
const limitarReservas = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  message: { mensaje: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
});

// POST /api/citas → PÚBLICO: el formulario de contacto
router.post('/', limitarReservas, async (req, res) => {
  try {
    // CORREGIDO: antes era new Cita(req.body) (aceptaba TODO lo que llegara).
    const datos = pick(req.body, CAMPOS_PUBLICOS);

    // String(...) evita inyección NoSQL: si alguien enviara plan: {"$ne": null}
    // Mongo lo interpretaría como un operador. Así siempre es texto.
    const plan = await Plan.findOne({ slug: String(datos.plan ?? ''), activo: true });
    if (!plan) return res.status(400).json({ mensaje: 'El plan seleccionado no existe' });

    const fecha = new Date(datos.fecha);
    if (isNaN(fecha) || fecha < new Date()) {
      return res.status(400).json({ mensaje: 'La fecha debe ser válida y futura' });
    }
    if (Number(datos.personas) > plan.maxPersonas) {
      return res.status(400).json({ mensaje: `Este plan admite máximo ${plan.maxPersonas} personas` });
    }

    const cita = await Cita.create({ ...datos, plan: plan.slug });
    // Respondemos poco: el público no necesita ver el documento completo
    res.status(201).json({ mensaje: 'Solicitud recibida', id: cita._id });
  } catch (error) {
    res.status(400).json({ mensaje: mensajeError(error) });
  }
});

// ---------- Desde aquí TODO es de ADMIN (requiere token) ----------
// CORREGIDO: antes cualquiera podía listar, editar y borrar citas.

// GET /api/citas → listar (ordenadas por fecha)
router.get('/', requireAdmin, async (req, res) => {
  try {
    res.json(await Cita.find().sort({ fecha: 1 }));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener citas' });
  }
});

// GET /api/citas/:id
router.get('/:id', requireAdmin, validarId, async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });
    res.json(cita);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar cita' });
  }
});

// PUT /api/citas/:id → el admin cambia datos o el estado
router.put('/:id', requireAdmin, validarId, async (req, res) => {
  try {
    const cita = await Cita.findByIdAndUpdate(
      req.params.id,
      pick(req.body, [...CAMPOS_PUBLICOS, 'estado']),
      { new: true, runValidators: true }
    );
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });
    res.json(cita);
  } catch (error) {
    res.status(400).json({ mensaje: mensajeError(error) });
  }
});

// DELETE /api/citas/:id
router.delete('/:id', requireAdmin, validarId, async (req, res) => {
  try {
    const cita = await Cita.findByIdAndDelete(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });
    res.json({ mensaje: 'Cita eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar' });
  }
});

module.exports = router;
