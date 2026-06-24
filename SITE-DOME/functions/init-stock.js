// POST /init-stock — à appeler une seule fois depuis l'admin pour initialiser le KV
// Protégé par Cloudflare Access (même URL pattern que /admin)
export async function onRequestPost(context) {
  try {
    const kv = context.env.STOCK_KV;
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV non configuré' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    const items = await context.request.json();

    for (const item of items) {
      const key = `stock:${item.id}:${item.size}`;
      await kv.put(key, String(item.qty));
    }

    return new Response(JSON.stringify({ success: true, count: items.length }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
