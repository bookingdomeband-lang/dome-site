export async function onRequestGet(context) {
  const stripeKey = context.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return new Response(JSON.stringify({ error: 'Clé Stripe manquante' }), { status: 500 });

  try {
    const res = await fetch(
      'https://api.stripe.com/v1/checkout/sessions?limit=50&expand[]=data.line_items&expand[]=data.customer_details',
      {
        headers: { 'Authorization': `Bearer ${stripeKey}` }
      }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const orders = data.data
      .filter(s => s.payment_status === 'paid')
      .map(s => ({
        id: s.id,
        date: s.created,
        amount: s.amount_total,
        currency: s.currency,
        customer: s.customer_details?.name || s.customer_details?.email || '—',
        email: s.customer_details?.email || '—',
        shipping: s.shipping_details?.address
          ? `${s.shipping_details.address.line1}, ${s.shipping_details.address.postal_code} ${s.shipping_details.address.city}`
          : '—',
        items: (s.line_items?.data || []).map(i => ({
          name: i.description,
          qty: i.quantity,
          amount: i.amount_total,
        }))
      }));

    return new Response(JSON.stringify(orders), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
