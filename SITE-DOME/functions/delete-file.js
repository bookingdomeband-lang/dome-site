const REPO = 'bookingdomeband-lang/dome-site';
const BASE_PATH = 'SITE-DOME';

export async function onRequestPost(context) {
  const { filepath } = await context.request.json();

  if (!filepath) {
    return new Response(JSON.stringify({ error: 'Chemin manquant' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  // Only allow deletion inside concerts/ subfolder for safety
  if (!filepath.startsWith('concerts/')) {
    return new Response(JSON.stringify({ error: 'Suppression non autorisée' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  const fullPath = `${BASE_PATH}/${filepath}`;

  // Get current SHA (required for deletion)
  const check = await fetch(`https://api.github.com/repos/${REPO}/contents/${fullPath}`, {
    headers: {
      'Authorization': `Bearer ${context.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'DOME-Admin',
    }
  });

  if (!check.ok) {
    return new Response(JSON.stringify({ error: 'Fichier introuvable' }), {
      status: 404, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { sha } = await check.json();

  // Delete file
  const response = await fetch(`https://api.github.com/repos/${REPO}/contents/${fullPath}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${context.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'DOME-Admin',
    },
    body: JSON.stringify({
      message: `Admin: suppression ${filepath}`,
      sha,
    })
  });

  if (!response.ok) {
    const err = await response.json();
    return new Response(JSON.stringify({ error: err.message || 'Erreur GitHub' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
