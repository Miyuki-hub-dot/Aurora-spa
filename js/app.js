/* =========================================================
   Together Spa — Lógica SPA
   Preparado para: conectar a API (Node/Express + MongoDB en Render)
   y luego agregar IA. Por ahora usa un mock local.
   ========================================================= */

const API_BASE = '/api'; // 👉 futuro: https://together-spa.onrender.com/api

/* -------- 1. ENRUTADOR SPA (hash-based) -------- */
const rutas = ['inicio', 'nosotros', 'planes', 'contacto'];

function mostrarVista(ruta) {
  if (!rutas.includes(ruta)) ruta = 'inicio';

  // Ocultar todas las vistas
  document.querySelectorAll('.vista').forEach(v => {
    v.hidden = true;
    v.classList.remove('activa');
  });

  // Mostrar la vista activa
  const vista = document.getElementById(`vista-${ruta}`);
  if (vista) {
    vista.hidden = false;
    vista.classList.add('activa');
  }

  // Actualizar aria-current del menú
  document.querySelectorAll('[data-route]').forEach(el => {
    if (el.dataset.route === ruta) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });

  // Cerrar menú móvil si está abierto
  document.getElementById('main-menu')?.classList.remove('abierto');

  // Scroll al top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function manejarHash() {
  const ruta = window.location.hash.replace('#', '') || 'inicio';
  mostrarVista(ruta);
}

window.addEventListener('hashchange', manejarHash);
window.addEventListener('DOMContentLoaded', manejarHash);

/* -------- 2. MENÚ MÓVIL -------- */
const navToggle = document.querySelector('.nav-toggle');
const mainMenu  = document.getElementById('main-menu');

navToggle?.addEventListener('click', () => {
  const abierto = mainMenu.classList.toggle('abierto');
  navToggle.setAttribute('aria-expanded', abierto);
});

/* -------- 3. BOTONES "RESERVAR" DE CADA PLAN -------- */
document.querySelectorAll('.btn-plan').forEach(btn => {
  btn.addEventListener('click', () => {
    const plan = btn.dataset.plan;
    // Ir a contacto y preseleccionar el plan
    window.location.hash = '#contacto';
    const select = document.getElementById('plan');
    if (select) select.value = plan;
  });
});

/* -------- 4. FORMULARIO DE RESERVA (mock listo para API) -------- */
const form = document.getElementById('form-reserva');
const feedback = document.getElementById('form-feedback');

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  feedback.textContent = '';

  const datos = Object.fromEntries(new FormData(form).entries());

  // Validación mínima
  if (!datos.nombre || !datos.email || !datos.plan) {
    feedback.textContent = 'Por favor completa nombre, correo y plan.';
    feedback.style.color = '#b23b3b';
    return;
  }

  // 🔮 MODO MOCK (hoy). Mañana: reemplazar por fetch real.
  try {
    // const res = await fetch(`${API_BASE}/reservas`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(datos)
    // });
    // const json = await res.json();

    // Simulación
    await new Promise(r => setTimeout(r, 600));
    console.log('Reserva simulada:', datos);

    feedback.style.color = '#1d4e89';
    feedback.textContent = `¡Gracias, ${datos.nombre}! Recibimos tu solicitud para el plan "${datos.plan}".`;
    form.reset();

    // 🧠 PUNTO DE INTEGRACIÓN FUTURA CON IA
    // Aquí podrías llamar a /api/ia/recomendar y sugerir un plan según el mensaje del usuario.
  } catch (err) {
    feedback.style.color = '#b23b3b';
    feedback.textContent = 'Ocurrió un error. Intenta de nuevo.';
    console.error(err);
  }
});