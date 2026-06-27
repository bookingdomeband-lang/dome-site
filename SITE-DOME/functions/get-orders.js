export async function onRequestGet(context) {
  const stripeKey = context.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return new Response(JSON.stringify({ error: 'Clé Stripe manquante' }), { status: 500 });

  try {
    const res = await fetch(
      'https://api.stripe.com/v1/checkout/sessions?limit=50' +
      '&expand[]=data.line_items' +
      '&expand[]=data.customer_details',
      { headers: { 'Authorization': `Bearer ${stripeKey}` } }
    );
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const orders = data.data
      .filter(s => s.payment_status === 'paid')
      .map(s => {
        // Shipping address — try shipping_details first, then customer_details
        const ship = s.shipping_details || s.shipping;
        const custAddr = s.customer_details?.address;

        let shipping = null;
        if (ship?.address) {
          shipping = {
            name: ship.name || s.customer_details?.name || '—',
            line1: ship.address.line1 || '',
            line2: ship.address.line2 || '',
            postal_code: ship.address.postal_code || '',
            city: ship.address.city || '',
            country: ship.address.country || '',
          };
        } else if (custAddr) {
          shipping = {
            name: s.customer_details?.name || '—',
            line1: custAddr.line1 || '',
            line2: custAddr.line2 || '',
            postal_code: custAddr.postal_code || '',
            city: custAddr.city || '',
            country: custAddr.country || '',
          };
        }

        return {
          id: s.id,
          date: s.created,
          amount: s.amount_total,
          currency: s.currency,
          customer: s.customer_details?.name || '—',
          email: s.customer_details?.email || '—',
          shipping,
          items: (s.line_items?.data || []).map(i => ({
            name: i.description,
            qty: i.quantity,
            amount: i.amount_total,
          }))
        };
      });

    return new Response(JSON.stringify(orders), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
