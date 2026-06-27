export async function onRequestPost(context) {
  const kv = context.env.STOCK_KV;
  if (!kv) return new Response(JSON.stringify({ error: 'KV non configuré' }), { status: 500 });

  const { orderId, shipped } = await context.request.json();
  if (!orderId) return new Response(JSON.stringify({ error: 'orderId manquant' }), { status: 400 });

  const key = `shipped:${orderId}`;
  if (shipped) {
    await kv.put(key, '1');
  } else {
    await kv.delete(key);
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
