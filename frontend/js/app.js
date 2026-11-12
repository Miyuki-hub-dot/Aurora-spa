/* =========================================================
   Aurora Spa — Lógica SPA (sitio público)
   Depende de: config.js (API_BASE) y utils.js (crear, apiFetch)
   ========================================================= */

/* -------- 1. ENRUTADOR SPA (hash-based) --------
   Con "#" funciona en GitHub Pages sin configurar nada en el servidor. */
const rutas = ['inicio', 'nosotros', 'planes', 'contacto'];

function mostrarVista(ruta) {
  if (!rutas.includes(ruta)) ruta = 'inicio';

  document.querySelectorAll('.vista').forEach(v => {
    v.hidden = true;
    v.classList.remove('activa');
  });

  const vista = document.getElementById(`vista-${ruta}`);
  if (vista) {
    vista.hidden = false;
    vista.classList.add('activa');
  }

  document.querySelectorAll('[data-route]').forEach(el => {
    if (el.dataset.route === ruta) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  document.getElementById('main-menu')?.classList.remove('abierto');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function manejarHash() {
  mostrarVista(window.location.hash.replace('#', '') || 'inicio');
}
window.addEventListener('hashchange', manejarHash);
window.addEventListener('DOMContentLoaded', manejarHash);

/* -------- 2. MENÚ MÓVIL -------- */
const navToggle = document.querySelector('.nav-toggle');
const mainMenu = document.getElementById('main-menu');

navToggle?.addEventListener('click', () => {
  const abierto = mainMenu.classList.toggle('abierto');
  navToggle.setAttribute('aria-expanded', abierto);
});

/* -------- 3. CATÁLOGO DE PLANES (viene de la API) -------- */
const contPlanes = document.getElementById('grid-planes');
const selectPlan = document.getElementById('plan');

async function cargarPlanes() {
  // Estado de carga: el usuario ve algo mientras espera
  contPlanes.replaceChildren(crear('p', { class: 'estado-carga', text: 'Cargando planes…' }));
  try {
    const planes = await apiFetch('/planes');
    renderPlanes(planes);
    poblarSelect(planes);
  } catch (err) {
    // Estado de error claro + forma de reintentar
    contPlanes.replaceChildren(
      crear('p', { class: 'estado-error', text: err.message }),
      crear('button', { class: 'btn-primario', type: 'button', text: 'Reintentar', onclick: cargarPlanes })
    );
  }
}

function renderPlanes(planes) {
  if (!planes.length) {
    contPlanes.replaceChildren(crear('p', { text: 'Pronto publicaremos nuestros planes.' }));
    return;
  }
  contPlanes.replaceChildren(...planes.map(p =>
    crear('article', { class: 'plan-card' + (p.destacado ? ' destacado' : '') }, [
      crear('h2', { text: p.nombre }),
      crear('p', { class: 'plan-precio', text: formatoCOP.format(p.precio) + ' ' }, [
        crear('small', { text: `/ ${p.personasTexto}` })
      ]),
      crear('ul', {}, [
        ...p.incluye.map(i => crear('li', { text: i })),
        crear('li', { text: `Duración total: ${p.duracion}` })
      ]),
      crear('button', { class: 'btn-primario btn-plan', type: 'button', 'data-plan': p.slug, text: 'Reservar' })
    ])
  ));
}

function poblarSelect(planes) {
  // Conserva la primera opción ("Selecciona un plan") y agrega el resto
  selectPlan.querySelectorAll('option:not(:first-child)').forEach(o => o.remove());
  planes.forEach(p => selectPlan.append(crear('option', { value: p.slug, text: p.nombre })));
}

/* -------- 4. BOTONES "RESERVAR" --------
   CORREGIDO: antes se hacía querySelectorAll('.btn-plan') al cargar la página,
   pero esos botones ahora se crean DESPUÉS (cuando llega la API) y no existirían
   todavía. Con "delegación de eventos" escuchamos al contenedor y detectamos
   el clic en cualquier botón, incluso los creados más tarde. */
contPlanes.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-plan');
  if (!btn) return;
  selectPlan.value = btn.dataset.plan;
  window.location.hash = '#contacto';
});

/* -------- 5. FORMULARIO DE RESERVA (ahora REAL) -------- */
const form = document.getElementById('form-reserva');
const feedback = document.getElementById('form-feedback');
const inputFecha = document.getElementById('fecha');

// La fecha mínima es "ahora" (ajustada a la zona horaria local)
const ahora = new Date();
ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
inputFecha.min = ahora.toISOString().slice(0, 16);

function mostrarFeedback(texto, tipo) {
  feedback.textContent = texto;
  feedback.className = `feedback ${tipo}`; // el color lo define el CSS (.ok / .error)
}

function validar(d) {
  if (!d.nombre.trim() || !d.email.trim() || !d.plan || !d.fecha || !d.personas) {
    return 'Por favor completa nombre, correo, plan, fecha y número de personas.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return 'El correo no parece válido.';
  if (new Date(d.fecha) < new Date()) return 'Elige una fecha y hora futuras.';
  if (Number(d.personas) < 1) return 'Debe asistir al menos 1 persona.';
  return null;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const datos = Object.fromEntries(new FormData(form));
  const error = validar(datos);
  if (error) return mostrarFeedback(error, 'error');

  const boton = form.querySelector('button[type="submit"]');
  boton.disabled = true; // evita doble envío
  boton.textContent = 'Enviando…';
  mostrarFeedback('', '');

  try {
    // Traducimos los nombres del formulario a los del modelo Cita del backend
    await apiFetch('/citas', {
      method: 'POST',
      body: JSON.stringify({
        nombreCliente: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        plan: datos.plan,
        fecha: new Date(datos.fecha).toISOString(),
        personas: Number(datos.personas),
        notas: datos.mensaje
      })
    });
    mostrarFeedback(`¡Gracias, ${datos.nombre}! Recibimos tu solicitud y te confirmaremos por correo.`, 'ok');
    form.reset();
  } catch (err) {
    mostrarFeedback(err.message, 'error');
  } finally {
    boton.disabled = false;
    boton.textContent = 'Enviar solicitud';
  }
});

cargarPlanes();
