const REPO = 'bookingdomeband-lang/dome-site';
const BASE_PATH = 'SITE-DOME';
const ALLOWED = ['dates.json', 'merch.json', 'members.json', 'texts.json'];

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { file, content, sha } = body;

  if (!ALLOWED.includes(file)) {
    return new Response(JSON.stringify({ error: 'Fichier non autorisé' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ error: result.message || 'Erreur GitHub' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ success: true, commit: result.commit?.sha }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
