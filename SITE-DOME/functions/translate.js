export async function onRequestPost(context) {
  const ai = context.env.AI;
  if (!ai) return json({ error: 'Binding AI non configuré dans Cloudflare Pages' }, 500);

  try {
    const { texts } = await context.request.json();

    // Traduire chaque champ individuellement avec le modèle m2m100
    const translated = {};
    for (const [key, value] of Object.entries(texts)) {
      if (!value || !value.trim()) {
        translated[key] = '';
        continue;
      }
      const result = await ai.run('@cf/meta/m2m100-1.2b', {
        text: value,
        source_lang: 'fr',
        target_lang: 'en',
      });
      translated[key] = result.translated_text || value;
    }

    return json(translated);
  } catch(e) {
    return json({ error: e.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
