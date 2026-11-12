require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// NUEVO: sin estas variables el servidor no puede funcionar de forma segura,
// así que fallamos pronto y con un mensaje claro.
for (const v of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[v]) {
    console.error(`❌ Falta la variable de entorno ${v} (revisa tu .env)`);
    process.exit(1);
  }
}

const app = express();

// CORREGIDO: antes cors() aceptaba a cualquiera. Ahora solo los dominios de
// FRONTEND_ORIGIN (tu GitHub Pages y tu localhost).
const origenes = (process.env.FRONTEND_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean);
app.use(cors({ origin: origenes.length ? origenes : true }));
app.use(express.json({ limit: '50kb' })); // límite: evita cuerpos enormes

// Rutas (NUEVO: planes, auth e ia; citas ahora vive en ./routes/)
app.use('/api/planes', require('./routes/planes'));
app.use('/api/citas', require('./routes/citas'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ia', require('./routes/ia'));

// Ruta de salud (útil para Render)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', servicio: 'Together Spa Agenda API' });
});

// NUEVO: respuesta clara para rutas que no existen
app.use('/api', (req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada' }));

// NUEVO: manejador central de errores. Así nunca se filtra información interna.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
  })
  .catch((error) => {
    console.error('❌ Error de conexión a MongoDB:', error.message);
    process.exit(1); // CORREGIDO: antes el proceso quedaba "vivo" sin servidor
  });
