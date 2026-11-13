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

// Llama a UN modelo de Gemini. Si Google no responde en 15 s, cancela (AbortSignal).
function llamarGemini(modelo, clave, cuerpo) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`,
    {
      method: 'POST',
      signal: AbortSignal.timeout(15000),
      headers: { 'content-type': 'application/json', 'x-goog-api-key': clave },
      body: cuerpo
    }
  );
}

// POST /api/ia/chat  { mensajes: [{ role: 'user'|'assistant', content }] } → { respuesta }
router.post('/chat', limitarIA, async (req, res) => {
  const clave = (process.env.GEMINI_API_KEY || '').trim();
  if (!clave) return res.status(503).json({ mensaje: 'La asistente no está configurada todavía.' });

  try {
    // Nunca confiamos en lo que manda el navegador: filtramos y recortamos.
    let mensajes = (Array.isArray(req.body.mensajes) ? req.body.mensajes : [])
      .slice(-10)
      .filter(m => ['user', 'assistant'].includes(m?.role) && typeof m.content === 'string' && m.content.trim())
      .map(m => ({ role: m.role, content: m.content.slice(0, 500) }));
    while (mensajes.length && mensajes[0].role !== 'user') mensajes.shift();
    if (!mensajes.length || mensajes.at(-1).role !== 'user') {
      return res.status(400).json({ mensaje: 'Escribe una pregunta para continuar.' });
    }

    const cuerpo = JSON.stringify({
      systemInstruction: { parts: [{ text: await construirSistema() }] },
      contents: mensajes.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
    });

    // Plan de intentos: modelo principal, un reintento del mismo y, si existe, el modelo de respaldo.
    const principal = (process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim();
    const respaldo = (process.env.GEMINI_MODEL_RESPALDO || '').trim();
    const intentos = [principal, principal, respaldo].filter(Boolean);

    let respuesta;
    for (const [i, modelo] of intentos.entries()) {
      respuesta = await llamarGemini(modelo, clave, cuerpo);
      // Solo reintentamos si Google está saturado (503) o limitó la cuota (429)
      if (respuesta.ok || ![429, 503].includes(respuesta.status)) break;
      if (i < intentos.length - 1) await new Promise(r => setTimeout(r, 1500));
    }

    if (!respuesta.ok) {
      console.error('Error API IA:', respuesta.status, await respuesta.text());
      const saturado = [429, 503].includes(respuesta.status);
      return res.status(saturado ? 503 : 502).json({
        mensaje: saturado
          ? 'La asistente tiene mucha demanda en este momento. Intenta de nuevo en un minuto.'
          : 'La asistente no está disponible en este momento.'
      });
    }

    const data = await respuesta.json();
    const texto = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n').trim();
    res.json({ respuesta: texto || 'No pude responder eso. ¿Puedes reformular tu pregunta? 🌿' });
  } catch (error) {
    console.error(error);
    if (error.name === 'TimeoutError') {
      return res.status(504).json({ mensaje: 'La asistente tardó demasiado en responder. Intenta de nuevo.' });
    }
    res.status(500).json({ mensaje: 'Error al consultar a la asistente.' });
  }
});

module.exports = router;
