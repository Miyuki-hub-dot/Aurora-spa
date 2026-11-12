// Única parte que cambia entre tu computador y producción.
// En local el backend corre en el puerto 5000; en producción usa la URL de Render.
// 👉 Cambia la URL de abajo por la tuya cuando despliegues en Render.
const API_BASE = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:5000/api'
  : 'https://together-spa.onrender.com/api';
