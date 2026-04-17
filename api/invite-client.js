/**
 * /api/invite-client.js
 * Sends a Supabase magic link to a new client for first-time portal access.
 * Expects: { clientEmail, clientName, projectTitle }
 */
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const PORTAL_URL = 'https://www.midodev.fr/client';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const missingVars = [];
    if (!process.env.SUPABASE_URL) missingVars.push('SUPABASE_URL');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!process.env.RESEND_API_KEY) missingVars.push('RESEND_API_KEY');
    if (missingVars.length > 0) {
        return res.status(500).json({ message: `Config Error: ${missingVars.join(', ')} manquant(s).` });
    }

    try {
        const { clientEmail, clientName, projectTitle } = req.body;
        if (!clientEmail) return res.status(400).json({ message: 'clientEmail requis.' });

        // 1. Generate magic link via Supabase Admin
        const supabaseAdmin = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: clientEmail,
            options: { redirectTo: PORTAL_URL },
        });

        if (linkError) {
            console.error('[invite-client] Supabase link error:', linkError.message);
            return res.status(500).json({ message: `Supabase Error: ${linkError.message}` });
        }

        const magicLink = linkData?.properties?.action_link || PORTAL_URL;

        // 2. Send invitation email via Resend
        const resend = new Resend(process.env.RESEND_API_KEY);

        const html = `
<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Helvetica Neue',Arial,sans-serif;">
<div style="max-width:580px;margin:0 auto;padding:40px 20px;">
  <div style="background:#111122;border-top:3px solid #39ff14;border-radius:12px;padding:36px;">
    <span style="color:#39ff14;font-size:26px;font-weight:900;">MIDO</span>
    <p style="color:#666;font-size:11px;letter-spacing:1px;margin:2px 0 28px;">DÉVELOPPEMENT WEB & MOBILE</p>

    <h2 style="color:#fff;margin:0 0 12px;font-size:20px;">Bienvenue dans votre espace client 👋</h2>
    <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 24px;">
      Bonjour <strong style="color:#fff;">${clientName || 'Client'}</strong>,<br>
      ${projectTitle ? `Votre projet <strong style="color:#39ff14;">${projectTitle}</strong> est en cours.` : `Mido Dev vous a créé un espace client dédié.`}<br>
      Vous pouvez y suivre l'avancement, consulter vos devis, échanger et régler vos factures.
    </p>

    <div style="text-align:center;margin:32px 0;">
      <a href="${magicLink}" style="background:#39ff14;color:#000;font-weight:900;font-size:15px;text-decoration:none;padding:16px 36px;border-radius:8px;display:inline-block;">
        Accéder à mon espace →
      </a>
      <p style="color:#444;font-size:12px;margin:14px 0 0;">Ce lien est valable 24h · Un seul clic suffit</p>
    </div>

    <div style="border-top:1px solid #1e1e30;padding-top:20px;margin-top:20px;">
      <p style="color:#444;font-size:11px;text-align:center;margin:0;">
        Votre espace : <a href="${PORTAL_URL}" style="color:#39ff14;">${PORTAL_URL}</a><br>
        Des questions ? Répondez directement à cet email.
      </p>
    </div>
  </div>
</div>
</body>
</html>
        `;

        const emailResult = await resend.emails.send({
            from: 'Mido Dev <contact@midodev.fr>',
            to: [clientEmail],
            subject: `Votre espace client Mido Dev est prêt 🚀`,
            html,
        });

        if (emailResult.error) {
            return res.status(400).json({ message: 'Email non envoyé', error: emailResult.error });
        }

        return res.status(200).json({ success: true, id: emailResult.id });

    } catch (err) {
        console.error('[invite-client] Error:', err.message);
        return res.status(500).json({ message: `Server Error: ${err.message}` });
    }
}
