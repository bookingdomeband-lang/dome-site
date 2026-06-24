const REPO = 'bookingdomeband-lang/dome-site';
const BASE_PATH = 'SITE-DOME';

export async function onRequestPost(context) {
  const { filename, content, subfolder } = await context.request.json();

  if (!filename || !content) {
    return new Response(JSON.stringify({ error: 'Paramètres manquants' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  const path = subfolder
    ? `${BASE_PATH}/${subfolder}/${safe}`
    : `${BASE_PATH}/${safe}`;

  // Check if file already exists (need SHA to overwrite)
  let sha = null;
  const check = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    headers: {
      'Authorization': `Bearer ${context.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DOME-Admin',
    }
  });
  if (check.ok) {
    const existing = await check.json();
    sha = existing.sha;
  }

  const body = {
    message: `Admin: upload ${subfolder ? subfolder + '/' : ''}${safe}`,
    content,
  };
  if (sha) body.sha = sha;

  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${context.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'DOME-Admin',
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const err = await response.json();
    return new Response(JSON.stringify({ error: err.message || 'Erreur GitHub' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true, filename: safe }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
