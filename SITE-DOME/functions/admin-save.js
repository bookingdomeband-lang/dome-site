const REPO = 'bookingdomeband-lang/dome-site';
const BASE_PATH = 'SITE-DOME';
const ALLOWED = ['dates.json', 'merch.json', 'members.json', 'texts.json'];

async function translateText(text, sourceLang = 'fr', targetLang = 'en') {
  if (!text || !text.trim()) return '';
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.responseData?.translatedText || text;
  } catch(e) {
    return text; // Fallback : texte original
  }
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  let { file, content, sha } = body;

  if (!ALLOWED.includes(file)) {
    return json({ error: 'Fichier non autorisé' }, 403);
  }

  // Pour texts.json : traduire côté serveur les champs FR → EN
  if (file === 'texts.json' && content) {
    const frFields = ['about_p1_fr', 'about_p2_fr', 'about_p3_fr', 'music_fr', 'news_fr'];
    for (const field of frFields) {
      if (content[field] !== undefined) {
        const enField = field.replace('_fr', '_en');
        // Ne traduire que si le champ EN est identique au FR (pas encore traduit)
        if (!content[enField] || content[enField] === content[field]) {
          content[enField] = await translateText(content[field]);
        }
      }
    }
  }

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${BASE_PATH}/${file}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${context.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'DOME-Admin',
    },
    body: JSON.stringify({
      message: `Admin: mise à jour ${file}`,
      content: encoded,
      sha,
    })
  });

  const result = await response.json();

  if (!response.ok) {
    return json({ error: result.message || 'Erreur GitHub' }, 500);
  }

  return json({ success: true, commit: result.commit?.sha });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
