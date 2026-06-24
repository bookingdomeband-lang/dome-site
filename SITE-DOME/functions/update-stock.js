export async function onRequestPost(context) {
  const kv = context.env.STOCK_KV;
  if (!kv) return new Response(JSON.stringify({ error: 'KV non configuré' }), { status: 500 });

  const { productId, size, qty } = await context.request.json();
  if (!productId || !size || qty === undefined) {
    return new Response(JSON.stringify({ error: 'Paramètres manquants' }), { status: 400 });
  }

  const key = `stock:${productId}:${size}`;
  await kv.put(key, String(Math.max(0, parseInt(qty))));

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
