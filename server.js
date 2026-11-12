require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors()); // En producción, restringe el origen a tu dominio
app.use(express.json());

// Rutas
app.use('/api/citas', require('./routes/citas'));

// Ruta de salud (útil para Render)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'Together Spa Agenda API' });
});

// Conexión a MongoDB y arranque del servidor
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Error de conexión a MongoDB:', error.message);
  });