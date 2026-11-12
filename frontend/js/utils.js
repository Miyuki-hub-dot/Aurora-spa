/* Funciones compartidas por app.js, chat.js y admin.js (para no repetir código) */

// Crea un elemento del DOM de forma segura.
// Usa textContent (no innerHTML): así, si un dato de la base de datos trae
// código malicioso, se muestra como texto y NO se ejecuta (previene XSS).
function crear(tag, { text, class: clase, ...attrs } = {}, hijos = []) {
  const el = document.createElement(tag);
  if (clase) el.className = clase;
  if (text !== undefined) el.textContent = text;
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v); // onclick → 'click'
    else el.setAttribute(k, v);
  }
  hijos.forEach(h => el.append(h));
  return el;
}

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

// fetch con manejo de errores centralizado. Lanza Error con un mensaje legible.
async function apiFetch(ruta, opciones = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opciones.headers || {}) };
  const token = sessionStorage.getItem('token'); // solo existe si el admin inició sesión
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_BASE}${ruta}`, { ...opciones, headers });
  } catch {
    // Render (plan gratis) "duerme" el servidor: la primera petición puede tardar ~1 min
    throw new Error('No hay conexión con el servidor. Si es la primera visita puede tardar hasta un minuto en despertar; intenta de nuevo.');
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(datos.mensaje || 'Ocurrió un error inesperado');
    error.status = res.status; // el panel admin usa el 401 para cerrar sesión
    throw error;
  }
  return datos;
}
