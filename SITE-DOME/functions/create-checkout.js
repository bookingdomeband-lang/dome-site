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

    // Collecte email pour l'envoi automatique du reçu Stripe
    params.append('customer_creation', 'always');
    params.append('payment_intent_data[setup_future_usage]', 'off_session');
    params.append('billing_address_collection', 'auto');

    const countries = ['FR', 'BE', 'CH', 'LU', 'DE', 'ES', 'IT', 'NL'];
    countries.forEach((c, i) => {
      params.append(`shipping_address_collection[allowed_countries][${i}]`, c);
    });

    // Frais de port fixes — 5€
    params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount');
    params.append('shipping_options[0][shipping_rate_data][fixed_amount][amount]', '500');
    params.append('shipping_options[0][shipping_rate_data][fixed_amount][currency]', 'eur');
    params.append('shipping_options[0][shipping_rate_data][display_name]', 'Livraison standard');
    params.append('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]', 'business_day');
    params.append('shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]', '3');
    params.append('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]', 'business_day');
    params.append('shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]', '7');

    items.forEach((item, i) => {
      const name = item.name + (item.size ? ` — Taille ${item.size}` : '');
      params.append(`line_items[${i}][price_data][currency]`, 'eur');
      params.append(`line_items[${i}][price_data][product_data][name]`, name);
      params.append(`line_items[${i}][price_data][unit_amount]`, String(item.price * 100));
      params.append(`line_items[${i}][quantity]`, String(item.qty));
    });

    // Stocker le panier dans les métadonnées de session — plus fiable pour le webhook
    const cartMeta = items.map(i => ({
      id: i.id,
      size: i.size || '—',
      color: i.color || '_',
      qty: i.qty
    }));
    params.append('metadata[cart]', JSON.stringify(cartMeta));

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
