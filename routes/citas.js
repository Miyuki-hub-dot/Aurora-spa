const express = require('express');
const router = express.Router();
const Cita = require('./models/Cita');

// GET /api/citas → Listar todas las citas (ordenadas por fecha)
router.get('/', async (req, res) => {
  try {
    const citas = await Cita.find().sort({ fecha: 1 });
    res.json(citas);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener citas', error: error.message });
  }
});

// GET /api/citas/:id → Obtener una cita por ID
router.get('/:id', async (req, res) => {
  try {
    const cita = await Cita.findById(req.params.id);
    if (!cita) return res.status(404).json({ mensaje: 'Cita no encontrada' });
    res.json(cita);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar cita', error: error.message });
  }
});

// POST /api/citas → Crear una nueva cita
router.post('/', async (req, res) => {
  try {
    const nuevaCita = new Cita(req.body);
    const citaGuardada = await nuevaCita.save();
    res.status(201).json(citaGuardada);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al crear cita', error: error.message });
  }
});

// PUT /api/citas/:id → Actualizar una cita
router.put('/:id', async (req, res) => {
  try {
    const citaActualizada = await Cita.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!citaActualizada) return res.status(404).json({ mensaje: 'Cita no encontrada' });
    res.json(citaActualizada);
  } catch (error) {
    res.status(400).json({ mensaje: 'Error al actualizar', error: error.message });
  }
});

// DELETE /api/citas/:id → Cancelar/eliminar una cita
router.delete('/:id', async (req, res) => {
  try {
    const citaEliminada = await Cita.findByIdAndDelete(req.params.id);
    if (!citaEliminada) return res.status(404).json({ mensaje: 'Cita no encontrada' });
    res.json({ mensaje: 'Cita eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar', error: error.message });
  }
});

module.exports = router;