async function verifyStripeSignature(body, signature, secret) {
  const elements = Object.fromEntries(signature.split(',').map(p => p.split('=')));
  const timestamp = elements.t;
  const sig = elements.v1;
  const signedPayload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const buf = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return expected === sig;
}

export async function onRequestPost(context) {
  const kv = context.env.STOCK_KV;
  const webhookSecret = context.env.STRIPE_WEBHOOK_SECRET;
  if (!kv || !webhookSecret) return new Response('Config manquante', { status: 500 });

  const body = await context.request.text();
  const signature = context.request.headers.get('stripe-signature') || '';
  const valid = await verifyStripeSignature(body, signature, webhookSecret);
  if (!valid) return new Response('Signature invalide', { status: 400 });

  const event = JSON.parse(body);
  if (event.type !== 'checkout.session.completed') return new Response('OK', { status: 200 });

  const session = event.data.object;

  // Fetch line items with product metadata
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session.id}/line_items?limit=100&expand[]=data.price.product`, {
    headers: { 'Authorization': `Bearer ${context.env.STRIPE_SECRET_KEY}` }
  });
  const { data: lineItems } = await res.json();

  for (const item of lineItems) {
    const meta = item.price?.product?.metadata || {};
    const productId = meta.product_id;
    const size = meta.size || '—';
    if (!productId) continue;

    const key = `stock:${productId}:${size}`;
    const current = parseInt(await kv.get(key) || '0');
    const newQty = Math.max(0, current - (item.quantity || 1));
    await kv.put(key, String(newQty));
  }

  return new Response('OK', { status: 200 });
}
