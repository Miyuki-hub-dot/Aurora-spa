/* Chat con la asistente de IA "Aurora". La clave de la IA NUNCA está aquí:
   el navegador solo habla con nuestro backend (/api/ia/chat). */
const chatToggle = document.getElementById('chat-toggle');
const chatPanel = document.getElementById('chat-panel');
const chatLog = document.getElementById('chat-log');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');

const historial = []; // [{ role, content }] — se reenvía completo en cada pregunta

function agregarMensaje(rol, texto) {
  const burbuja = crear('div', { class: `msg ${rol}`, text: texto });
  chatLog.append(burbuja);
  chatLog.scrollTop = chatLog.scrollHeight;
  return burbuja;
}

function alternarChat(abrir) {
  chatPanel.hidden = !abrir;
  chatToggle.setAttribute('aria-expanded', abrir);
  if (abrir) {
    if (!chatLog.children.length) {
      agregarMensaje('assistant', '¡Hola! Soy Aurora 🌿 Cuéntame con quién te gustaría venir y te recomiendo un plan.');
    }
    chatInput.focus();
  }
}

chatToggle.addEventListener('click', () => alternarChat(chatPanel.hidden));
document.getElementById('chat-cerrar').addEventListener('click', () => alternarChat(false));

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pregunta = chatInput.value.trim();
  if (!pregunta) return;

  agregarMensaje('user', pregunta);
  historial.push({ role: 'user', content: pregunta });
  chatInput.value = '';
  chatInput.disabled = true;
  const escribiendo = agregarMensaje('assistant', 'Escribiendo…'); // estado de carga

  try {
    const { respuesta } = await apiFetch('/ia/chat', {
      method: 'POST',
      body: JSON.stringify({ mensajes: historial })
    });
    escribiendo.textContent = respuesta;
    historial.push({ role: 'assistant', content: respuesta });
  } catch (err) {
    escribiendo.textContent = err.message;
    escribiendo.classList.add('error');
    historial.pop(); // la pregunta falló: la quitamos para no dejar el historial desordenado
  } finally {
    chatInput.disabled = false;
    chatInput.focus();
  }
});
