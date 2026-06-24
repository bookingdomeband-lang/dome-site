const REPO = 'bookingdomeband-lang/dome-site';
const BASE_PATH = 'SITE-DOME';
const ALLOWED = ['dates.json', 'merch.json', 'members.json', 'concerts.json'];

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const file = searchParams.get('file');

  if (!ALLOWED.includes(file)) {
    return new Response(JSON.stringify({ error: 'Fichier non autorisé' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }

  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${BASE_PATH}/${file}`, {
    headers: {
      'Authorization': `Bearer ${context.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DOME-Admin',
    }
  });

  if (!response.ok) {
    return new Response(JSON.stringify({ error: 'Erreur GitHub', status: response.status }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  const data = await response.json();
  const content = JSON.parse(atob(data.content.replace(/\n/g, '')));

  return new Response(JSON.stringify({ content, sha: data.sha }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
