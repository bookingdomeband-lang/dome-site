const REPO = 'bookingdomeband-lang/dome-site';
const BASE_PATH = 'SITE-DOME';
const ALLOWED = ['dates.json', 'merch.json', 'members.json', 'texts.json'];

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Corps de requête invalide' }, 400);
  }

  const { file, content, sha } = body;

  if (!ALLOWED.includes(file)) {
    return json({ error: 'Fichier non autorisé' }, 403);
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
