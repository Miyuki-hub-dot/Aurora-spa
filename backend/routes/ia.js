const express = require('express');
const rateLimit = require('express-rate-limit');
const Plan = require('../models/Plan');

const router = express.Router();

// Cada mensaje consume cuota de la IA: limitamos por IP
const limitarIA = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 20,
  message: { mensaje: 'Has hecho muchas preguntas seguidas. Intenta en unos minutos.' }
});

// El "system prompt" es lo que vuelve PERSONALIZADA a la IA: le damos
// identidad, tono de marca, reglas y los datos reales del negocio (desde la BD).
async function construirSistema() {
  const planes = await Plan.find({ activo: true }).sort({ precio: 1 });
  const catalogo = planes.map(p =>
    `- ${p.nombre} (código: ${p.slug}): $${p.precio.toLocaleString('es-CO')} COP, ${p.personasTexto}, ` +
    `duración ${p.duracion}. Incluye: ${p.incluye.join('; ')}.`
  ).join('\n');

  return `Eres "Aurora", la asistente virtual de Aurora Spa, un spa donde el bienestar se vive en compañía (pareja, amigos o familia).

TONO: cálido, sereno y cercano. Tutea. Respuestas cortas (máximo 4 frases). Puedes usar un emoji suave ocasionalmente.

PLANES DISPONIBLES (usa solo esta información, no inventes precios, horarios ni servicios):
${catalogo || '(Aún no hay planes publicados)'}

REGLAS:
- Habla solo de Aurora Spa y sus planes. Si preguntan otra cosa, redirige amablemente.
- Nuestros masajes son relajantes, NO medicinales: no des consejos médicos ni prometas efectos de salud.
- Para recomendar, pregunta con quién vienen y cuántas personas son.
- Para reservar, indica que llenen el formulario de la sección "Contacto" (la disponibilidad se confirma por correo).
- Si piden un mensaje listo para enviar, redáctalo con nombre del plan, número de personas y fecha tentativa, para que lo peguen en el formulario.`;
}

// POST /api/ia/chat  { mensajes: [{ role: 'user'|'assistant', content }] } → { respuesta }
router.post('/chat', limitarIA, async (req, res) => {
  // CAMBIO: ahora usamos Gemini (Google). La clave vive SOLO en el servidor.
  const clave = (process.env.GEMINI_API_KEY || '').trim();
  if (!clave) return res.status(503).json({ mensaje: 'La asistente no está configurada todavía.' });

  try {
    // Nunca confiamos en lo que manda el navegador: filtramos y recortamos.
    let mensajes = (Array.isArray(req.body.mensajes) ? req.body.mensajes : [])
      .slice(-10)
      .filter(m => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string' && m.content.trim())
      .map(m => ({ role: m.role, content: m.content.slice(0, 500) }));
    while (mensajes.length && mensajes[0].role !== 'user') mensajes.shift(); // empezar siempre con "user"
    if (!mensajes.length || mensajes.at(-1).role !== 'user') {
      return res.status(400).json({ mensaje: 'Escribe una pregunta para continuar.' });
    }

    // .trim() quita espacios sobrantes (un espacio en el nombre del modelo rompe la URL)
    const modelo = (process.env.GEMINI_MODEL || 'gemini-2.5-flash').trim();

    const respuesta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': clave },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: await construirSistema() }] },
          // Gemini llama "model" a lo que otras APIs llaman "assistant"
          contents: mensajes.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
        })
      }
    );

    if (!respuesta.ok) {
      console.error('Error API IA:', respuesta.status, await respuesta.text());
      return res.status(502).json({ mensaje: 'La asistente no está disponible en este momento.' });
    }
    const data = await respuesta.json();
    const texto = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n').trim();
    if (!texto) return res.json({ respuesta: 'No pude responder eso. ¿Puedes reformular tu pregunta? 🌿' });
    res.json({ respuesta: texto });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al consultar a la asistente.' });
  }
});

module.exports = router;
