// Ideas IA para el equipo. La API key vive en Vercel (ANTHROPIC_API_KEY), nunca en el navegador.
const FIREBASE_WEB_KEY = 'AIzaSyCMOorpDurNhs7b28buNM1v_YNNdSBdgNk';
const PERMITIDOS = (process.env.TEAM_EMAILS || 'yuliushc@gmail.com,jaredperez.sax@gmail.com')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

async function emailDelToken(idToken) {
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_WEB_KEY, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.users && j.users[0] && j.users[0].email ? j.users[0].email.toLowerCase() : null;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(500).json({ error: 'Falta configurar la API key en Vercel' });

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const email = token ? await emailDelToken(token) : null;
  if (!email || !PERMITIDOS.includes(email)) return res.status(401).json({ error: 'Sesión no válida' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const c = body.cliente || {};
  const m = c.marca || {};
  const tema = String(body.tema || '').slice(0, 200);
  if (!c.nombre) return res.status(400).json({ error: 'Falta el cliente' });

  const marca = [
    m.desc && 'Sobre el negocio: ' + m.desc,
    m.publico && 'Público objetivo: ' + m.publico,
    m.tono && 'Tono de voz: ' + m.tono,
    m.colores && 'Colores de marca: ' + m.colores,
    m.tipo && 'Tipografías: ' + m.tipo,
    m.estrella && 'Productos estrella: ' + m.estrella,
    m.evitar && 'PROHIBIDO (nunca hacer): ' + m.evitar
  ].filter(Boolean).join('\n');

  const prompt = `Eres el director creativo de FRASCO Creative Office, agencia de marketing en Ciudad Obregón, Sonora, México. Genera 5 ideas de publicaciones para redes sociales, pensadas para producirse en video, para este cliente:
Cliente: ${c.nombre}
Giro: ${c.giro || ''}
Redes: ${c.redes || ''}
${marca}
${tema ? 'Tema u ocasión: ' + tema : ''}
Contexto local: Ciudad Obregón, Sonora. Tono cercano, mexicano del norte, sin clichés de agencia.
Responde SOLO con un arreglo JSON válido, sin markdown ni texto adicional, con este formato exacto:
[{"titulo":"...","formato":"Reel|Carrusel|Diseño|Story","gancho":"primera línea o hook del video/post","descripcion":"qué se graba y por qué funciona, máx 30 palabras","prompt_imagen":"prompt detallado en inglés para generar la imagen o portada en una IA de imágenes"}]`;

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: 'La IA no respondió' });
    const txt = (data.content || []).map(b => b.text || '').join('').replace(/```json|```/g, '').trim();
    return res.status(200).json({ ideas: JSON.parse(txt) });
  } catch (e) {
    return res.status(502).json({ error: 'Respuesta inválida de la IA' });
  }
};
