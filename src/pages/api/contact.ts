/**
 * MONTACUTI — Endpoint form contatto via Resend
 *
 * Richiede env vars:
 *   RESEND_API_KEY    chiave API Resend (production: secret, dev: .env)
 *   CONTACT_EMAIL     destinatario delle richieste
 *   CONTACT_FROM      mittente "from" (deve essere su dominio verificato in Resend)
 *
 * In modalità output:'static' la pagina è server-on-demand grazie a
 * `prerender = false`. L'adapter Node serve build/dev locale; in produzione
 * sostituire con adapter Vercel/Netlify.
 */
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

interface ContactPayload {
  nome?: string;
  email?: string;
  telefono?: string;
  tipologia?: string;
  messaggio?: string;
  privacy?: boolean;
  /** Honeypot anti-bot: campo nascosto che i bot tendono a compilare. */
  website?: string;
}

const TIPOLOGIE_VALID = new Set([
  'residenziale',
  'commerciale-terziario',
  'riqualificazione',
  'altro',
]);

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}

export const POST: APIRoute = async ({ request }) => {
  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON' }, 400);
  }

  // Honeypot — bot rilevato: ritorna OK silenzioso per non rivelare la trappola
  if (payload.website && payload.website.trim().length > 0) {
    return jsonResponse({ ok: true });
  }

  const nome = (payload.nome ?? '').trim();
  const email = (payload.email ?? '').trim();
  const telefono = (payload.telefono ?? '').trim();
  const tipologia = (payload.tipologia ?? '').trim();
  const messaggio = (payload.messaggio ?? '').trim();
  const privacy = !!payload.privacy;

  // Validazione
  const errors: Record<string, string> = {};
  if (nome.length < 2) errors.nome = 'Inserisci il tuo nome.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email non valida.';
  if (messaggio.length < 10) errors.messaggio = 'Scrivi almeno qualche riga sul progetto.';
  if (!privacy) errors.privacy = 'È necessario accettare la privacy.';
  if (tipologia && !TIPOLOGIE_VALID.has(tipologia)) {
    errors.tipologia = 'Tipologia non valida.';
  }
  if (Object.keys(errors).length > 0) {
    return jsonResponse({ ok: false, errors }, 422);
  }

  const apiKey = import.meta.env.RESEND_API_KEY;
  const to = import.meta.env.CONTACT_EMAIL;
  const from = import.meta.env.CONTACT_FROM;

  if (!apiKey || !to || !from) {
    console.error('[api/contact] missing env: RESEND_API_KEY/CONTACT_EMAIL/CONTACT_FROM');
    return jsonResponse(
      { ok: false, error: "Servizio non configurato. Riprova più tardi o scrivi via email." },
      500,
    );
  }

  const resend = new Resend(apiKey);
  try {
    const subject = `[Sito] Nuova richiesta da ${nome}`;
    const html = `
      <h2 style="font-family: Georgia, serif;">Nuova richiesta dal sito</h2>
      <p><strong>Nome:</strong> ${escapeHtml(nome)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      ${telefono ? `<p><strong>Telefono:</strong> ${escapeHtml(telefono)}</p>` : ''}
      ${tipologia ? `<p><strong>Tipologia:</strong> ${escapeHtml(tipologia)}</p>` : ''}
      <hr/>
      <p><strong>Messaggio:</strong></p>
      <p>${escapeHtml(messaggio).replace(/\n/g, '<br/>')}</p>
    `.trim();

    await resend.emails.send({
      from,
      to,
      subject,
      replyTo: email,
      html,
    });

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('[api/contact] resend error', err);
    return jsonResponse(
      { ok: false, error: 'Errore di invio. Riprova o scrivi via email.' },
      500,
    );
  }
};
