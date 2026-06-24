export async function onRequestPost(context) {
  try {
    const kv = context.env.STOCK_KV;
    if (!kv) return new Response(JSON.stringify({ error: 'KV non configuré' }), { status: 500, headers: { 'Content-Type': 'application/json' } });

    const items = await context.request.json();
    // items: [{ id, size, color, qty }]
    // color is optional, defaults to "_" (no color)

    for (const item of items) {
      const color = item.color || '_';
      const key = `stock:${item.id}:${item.size}:${color}`;
      await kv.put(key, String(item.qty));
    }

    return new Response(JSON.stringify({ success: true, count: items.length }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
