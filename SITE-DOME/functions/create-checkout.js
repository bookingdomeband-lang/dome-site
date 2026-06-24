export async function onRequestPost(context) {
  const stripeKey = context.env.STRIPE_SECRET_KEY;

  try {
    const { items } = await context.request.json();
    const url = new URL(context.request.url);
    const origin = url.origin;

    // Build form-encoded body for Stripe API (no npm package needed)
    const params = new URLSearchParams();
    params.append('mode', 'payment');
    params.append('locale', 'fr');
    params.append('success_url', `${origin}/success.html`);
    params.append('cancel_url', `${origin}/#merch`);

    const countries = ['FR', 'BE', 'CH', 'LU', 'DE', 'ES', 'IT', 'NL'];
    countries.forEach((c, i) => {
      params.append(`shipping_address_collection[allowed_countries][${i}]`, c);
    });

    items.forEach((item, i) => {
      const name = item.name + (item.size ? ` — Taille ${item.size}` : '');
      params.append(`line_items[${i}][price_data][currency]`, 'eur');
      params.append(`line_items[${i}][price_data][product_data][name]`, name);
      // Store product id and size in metadata for webhook stock decrement
      params.append(`line_items[${i}][price_data][product_data][metadata][product_id]`, item.id || '');
      params.append(`line_items[${i}][price_data][product_data][metadata][size]`, item.size || '—');
      params.append(`line_items[${i}][price_data][unit_amount]`, String(item.price * 100));
      params.append(`line_items[${i}][quantity]`, String(item.qty));
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const session = await response.json();

    if (session.error) {
      return new Response(JSON.stringify({ error: session.error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
