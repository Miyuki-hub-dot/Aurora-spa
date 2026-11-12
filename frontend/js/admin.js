/* Panel de administrador: login + gestión de citas y planes.
   Depende de: config.js y utils.js */
const $ = (s) => document.querySelector(s);
const formPlan = $('#form-plan');
let planEditandoId = null; // null = estamos creando; con valor = editando ese plan

/* ---------- Sesión ----------
   El token se guarda en sessionStorage: se borra al cerrar la pestaña.
   (localStorage dura más pero es más riesgoso si hubiera una falla XSS.) */
function actualizarVista() {
  const activa = !!sessionStorage.getItem('token');
  $('#login').hidden = activa;
  $('#panel').hidden = !activa;
  if (activa) { cargarCitas(); cargarPlanes(); }
}

function cerrarSesion(aviso = '') {
  sessionStorage.removeItem('token');
  actualizarVista();
  $('#login-feedback').textContent = aviso;
}

// Si el servidor responde 401, el token venció: volvemos al login
function manejar401(err) {
  if (err.status === 401) cerrarSesion('Tu sesión expiró. Inicia sesión de nuevo.');
}

$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fb = $('#login-feedback');
  const boton = e.target.querySelector('button');
  boton.disabled = true;
  fb.textContent = '';
  try {
    const { token } = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usuario: e.target.usuario.value, password: e.target.password.value })
    });
    sessionStorage.setItem('token', token);
    e.target.reset();
    actualizarVista();
  } catch (err) {
    fb.textContent = err.message;
  } finally {
    boton.disabled = false;
  }
});

$('#btn-salir').addEventListener('click', () => cerrarSesion());

const filaMensaje = (texto, cols) => crear('tr', {}, [crear('td', { colspan: cols, text: texto })]);

/* ---------- Citas ---------- */
async function cargarCitas() {
  const tbody = $('#tabla-citas tbody');
  tbody.replaceChildren(filaMensaje('Cargando…', 8));
  try {
    const citas = await apiFetch('/citas');
    tbody.replaceChildren(...(citas.length ? citas.map(filaCita) : [filaMensaje('Aún no hay solicitudes', 8)]));
  } catch (err) {
    manejar401(err);
    tbody.replaceChildren(filaMensaje(err.message, 8));
  }
}

function filaCita(c) {
  const select = crear('select', {
    'aria-label': 'Estado de la cita',
    onchange: async () => {
      try {
        await apiFetch(`/citas/${c._id}`, { method: 'PUT', body: JSON.stringify({ estado: select.value }) });
      } catch (err) { manejar401(err); alert(err.message); cargarCitas(); }
    }
  }, ['pendiente', 'confirmada', 'cancelada'].map(e => {
    const o = crear('option', { value: e, text: e });
    o.selected = e === c.estado;
    return o;
  }));

  const borrar = crear('button', {
    class: 'btn-peligro', type: 'button', text: 'Eliminar',
    onclick: async () => {
      if (!confirm(`¿Eliminar la solicitud de ${c.nombreCliente}?`)) return;
      try { await apiFetch(`/citas/${c._id}`, { method: 'DELETE' }); cargarCitas(); }
      catch (err) { manejar401(err); alert(err.message); }
    }
  });

  return crear('tr', {}, [
    crear('td', { text: c.nombreCliente }),
    crear('td', { text: `${c.email}${c.telefono ? ' · ' + c.telefono : ''}` }),
    crear('td', { text: c.plan }),
    crear('td', { text: new Date(c.fecha).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) }),
    crear('td', { text: c.personas }),
    crear('td', { text: c.notas || '—' }),
    crear('td', {}, [select]),
    crear('td', {}, [borrar])
  ]);
}

/* ---------- Planes ---------- */
async function cargarPlanes() {
  const tbody = $('#tabla-planes tbody');
  tbody.replaceChildren(filaMensaje('Cargando…', 5));
  try {
    const planes = await apiFetch('/planes/todos');
    tbody.replaceChildren(...(planes.length ? planes.map(filaPlan) : [filaMensaje('No hay planes', 5)]));
  } catch (err) {
    manejar401(err);
    tbody.replaceChildren(filaMensaje(err.message, 5));
  }
}

function filaPlan(p) {
  return crear('tr', {}, [
    crear('td', { text: p.nombre }),
    crear('td', { text: formatoCOP.format(p.precio) }),
    crear('td', { text: p.personasTexto }),
    crear('td', { text: p.activo ? 'Sí' : 'No' }),
    crear('td', {}, [
      crear('button', { class: 'btn-secundario', type: 'button', text: 'Editar', onclick: () => editarPlan(p) }),
      crear('button', {
        class: 'btn-peligro', type: 'button', text: 'Eliminar',
        onclick: async () => {
          if (!confirm(`¿Eliminar el plan "${p.nombre}"?`)) return;
          try { await apiFetch(`/planes/${p._id}`, { method: 'DELETE' }); cargarPlanes(); }
          catch (err) { manejar401(err); alert(err.message); }
        }
      })
    ])
  ]);
}

function editarPlan(p) {
  planEditandoId = p._id;
  const f = formPlan.elements;
  f.slug.value = p.slug; f.nombre.value = p.nombre; f.precio.value = p.precio;
  f.personasTexto.value = p.personasTexto; f.maxPersonas.value = p.maxPersonas;
  f.duracion.value = p.duracion; f.incluye.value = p.incluye.join('\n');
  f.destacado.checked = p.destacado; f.activo.checked = p.activo;
  $('#titulo-form-plan').textContent = `Editando: ${p.nombre}`;
  formPlan.scrollIntoView({ behavior: 'smooth' });
}

function reiniciarFormPlan() {
  planEditandoId = null;
  formPlan.reset();
  formPlan.elements.activo.checked = true;
  $('#titulo-form-plan').textContent = 'Nuevo plan';
}
$('#btn-cancelar-plan').addEventListener('click', reiniciarFormPlan);

formPlan.addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = formPlan.elements;
  const fb = $('#plan-feedback');
  const cuerpo = {
    slug: f.slug.value, nombre: f.nombre.value, precio: Number(f.precio.value),
    personasTexto: f.personasTexto.value, maxPersonas: Number(f.maxPersonas.value),
    duracion: f.duracion.value,
    incluye: f.incluye.value.split('\n').map(s => s.trim()).filter(Boolean), // 1 línea = 1 ítem
    destacado: f.destacado.checked, activo: f.activo.checked
  };
  try {
    await apiFetch(planEditandoId ? `/planes/${planEditandoId}` : '/planes', {
      method: planEditandoId ? 'PUT' : 'POST',
      body: JSON.stringify(cuerpo)
    });
    fb.textContent = 'Plan guardado ✔'; fb.className = 'feedback ok';
    reiniciarFormPlan();
    cargarPlanes();
  } catch (err) {
    manejar401(err);
    fb.textContent = err.message; fb.className = 'feedback error';
  }
});

actualizarVista();
