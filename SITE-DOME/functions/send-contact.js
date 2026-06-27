export async function onRequestPost(context) {
  const env = context.env;

  try {
    const { name, subject, message, turnstileToken } = await context.request.json();

    // Validation basique
    if (!message || message.trim().length < 5) {
      return json({ error: 'Message trop court.' }, 400);
    }

    // Vérification Turnstile
    const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET,
        response: turnstileToken,
      }),
    });
    const turnstileData = await turnstileRes.json();
    if (!turnstileData.success) {
      return json({ error: 'Vérification anti-bot échouée. Réessayez.' }, 403);
    }

    // Envoi via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Contact DOME <contact@dome-official.com>',
        to: ['booking.domeband@gmail.com'],
        reply_to: name ? `${name} <booking.domeband@gmail.com>` : undefined,
        subject: subject?.trim() || 'Message depuis dome-official.com',
        text: `Nom : ${name || 'Non renseigné'}\n\n${message}`,
        html: `<p><strong>Nom :</strong> ${name || 'Non renseigné'}</p><br><p>${message.replace(/\n/g, '<br>')}</p>`,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.json();
      throw new Error(err.message || 'Erreur Resend');
    }

    return json({ success: true });
  } catch (e) {
    return json({ error: e.message || 'Erreur serveur.' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
