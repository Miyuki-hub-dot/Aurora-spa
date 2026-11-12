const express = require('express');
const Plan = require('../models/Plan');
const requireAdmin = require('../middleware/auth');
const { pick, mensajeError, validarId } = require('../utils/helpers');

const router = express.Router();
const CAMPOS = ['slug', 'nombre', 'precio', 'personasTexto', 'maxPersonas', 'duracion', 'incluye', 'destacado', 'activo'];

// GET /api/planes → PÚBLICO: solo planes activos (es el catálogo del sitio)
router.get('/', async (req, res) => {
  try {
    res.json(await Plan.find({ activo: true }).sort({ precio: 1 }));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener planes' });
  }
});

// GET /api/planes/todos → ADMIN: incluye los inactivos.
// Va ANTES de '/:id' porque Express lee las rutas en orden.
router.get('/todos', requireAdmin, async (req, res) => {
  try {
    res.json(await Plan.find().sort({ precio: 1 }));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener planes' });
  }
});

// POST /api/planes → ADMIN: crear
router.post('/', requireAdmin, async (req, res) => {
  try {
    res.status(201).json(await Plan.create(pick(req.body, CAMPOS)));
  } catch (error) {
    res.status(400).json({ mensaje: mensajeError(error) });
  }
});

// PUT /api/planes/:id → ADMIN: editar
router.put('/:id', requireAdmin, validarId, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, pick(req.body, CAMPOS), { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ mensaje: 'Plan no encontrado' });
    res.json(plan);
  } catch (error) {
    res.status(400).json({ mensaje: mensajeError(error) });
  }
});

// DELETE /api/planes/:id → ADMIN: eliminar
router.delete('/:id', requireAdmin, validarId, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ mensaje: 'Plan no encontrado' });
    res.json({ mensaje: 'Plan eliminado' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar' });
  }
});

module.exports = router;
