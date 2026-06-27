export async function onRequestPost(context) {
  try {
    const { texts } = await context.request.json();
    const translated = {};

    for (const [key, value] of Object.entries(texts)) {
      if (!value || !value.trim()) {
        translated[key] = '';
        continue;
      }
      // MyMemory API — gratuit, sans clé, sans compte
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(value)}&langpair=fr|en`;
      const res = await fetch(url);
      const data = await res.json();
      translated[key] = data.responseData?.translatedText || value;
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
