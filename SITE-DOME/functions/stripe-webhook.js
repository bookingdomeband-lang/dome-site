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

  // Lire le panier depuis les métadonnées de session
  let cart = [];
  try {
    cart = JSON.parse(session.metadata?.cart || '[]');
  } catch(e) {
    return new Response('Métadonnées invalides', { status: 400 });
  }

  for (const item of cart) {
    const key = `stock:${item.id}:${item.size}:${item.color}`;
    const current = parseInt(await kv.get(key) || '0');
    const newQty = Math.max(0, current - (item.qty || 1));
    await kv.put(key, String(newQty));
  }

  return new Response('OK', { status: 200 });
}
