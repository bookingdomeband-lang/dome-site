export async function onRequestGet(context) {
  try {
    const kv = context.env.STOCK_KV;
    if (!kv) {
      return new Response(JSON.stringify({ error: 'KV non configuré' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    // List all stock keys
    const list = await kv.list({ prefix: 'stock:' });
    const stock = {};

    for (const key of list.keys) {
      const value = await kv.get(key.name);
      // key format: stock:product-id:SIZE
      const parts = key.name.split(':');
      const productId = parts[1];
      const size = parts[2];
      if (!stock[productId]) stock[productId] = {};
      stock[productId][size] = parseInt(value || '0');
    }

    return new Response(JSON.stringify(stock), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}
