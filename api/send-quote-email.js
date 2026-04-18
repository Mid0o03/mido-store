/**
 * /api/send-quote-email.js
 * Sends a branded email to the client with their quote and portal login link.
 * Expects: { clientEmail, clientName, quoteNumber, total, depositAmount, validUntil, notes }
 */
import { Resend } from 'resend';

const BRAND_COLOR = '#39ff14';
const PORTAL_URL = 'https://www.midodev.fr/client';

const emailTemplate = ({ clientName, quoteNumber, total, depositAmount, validUntil, notes }) => `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Votre Devis Mido Dev</title></head>
<body style="margin:0;padding:0;background:#0a0a14;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="border-top:3px solid ${BRAND_COLOR};background:#111122;border-radius:12px 12px 0 0;padding:32px 36px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="color:${BRAND_COLOR};font-size:28px;font-weight:900;letter-spacing:-1px;">MIDO</span>
          <p style="color:#aaa;font-size:11px;margin:2px 0 0;letter-spacing:1px;">DÉVELOPPEMENT WEB & MOBILE</p>
        </div>
        <div style="background:rgba(57,255,20,0.1);border:1px solid rgba(57,255,20,0.3);padding:8px 18px;border-radius:8px;">
          <span style="color:${BRAND_COLOR};font-size:12px;font-weight:700;letter-spacing:2px;">DEVIS</span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="background:#13131f;border:1px solid #1e1e30;border-top:none;padding:36px;">

      <p style="color:#aaa;font-size:14px;margin:0 0 8px;">Bonjour <strong style="color:#fff;">${clientName}</strong>,</p>
      <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 28px;">
        Voici votre devis <strong style="color:#fff;">${quoteNumber}</strong>.<br>
        Vous pouvez le consulter, l'accepter et régler l'acompte directement depuis votre espace client.
      </p>

      <!-- Amount Box -->
      <div style="background:#0a0a14;border:1px solid #1e1e30;border-radius:10px;padding:24px;margin-bottom:20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="color:#666;font-size:12px;padding:6px 0;letter-spacing:1px;">MONTANT TOTAL</td>
            <td style="color:${BRAND_COLOR};font-size:22px;font-weight:900;text-align:right;font-family:monospace;">${total} €</td>
          </tr>
          <tr>
            <td colspan="2" style="border-top:1px solid #1e1e30;padding-top:12px;margin-top:12px;"></td>
          </tr>
          <tr>
            <td style="color:#666;font-size:12px;letter-spacing:1px;">ACOMPTE 30% À LA SIGNATURE</td>
            <td style="color:#fff;font-size:16px;font-weight:700;text-align:right;font-family:monospace;">${depositAmount} €</td>
          </tr>
          ${validUntil ? `<tr><td style="color:#666;font-size:11px;padding-top:8px;">Valide jusqu'au</td><td style="color:#888;font-size:11px;text-align:right;padding-top:8px;">${validUntil}</td></tr>` : ''}
        </table>
      </div>

      ${notes ? `<div style="background:#0f0f1e;border-left:3px solid ${BRAND_COLOR};padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:20px;"><p style="color:#aaa;font-size:13px;margin:0;line-height:1.6;">${notes}</p></div>` : ''}

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${PORTAL_URL}" style="background:${BRAND_COLOR};color:#000;font-weight:900;font-size:15px;text-decoration:none;padding:16px 36px;border-radius:8px;display:inline-block;letter-spacing:0.5px;">
          ✓ Accepter & Payer l'acompte →
        </a>
        <p style="color:#555;font-size:12px;margin:14px 0 0;">Connectez-vous sur <a href="${PORTAL_URL}" style="color:${BRAND_COLOR};">midodev.fr/client</a></p>
      </div>

      <!-- Legal -->
      <p style="color:#444;font-size:11px;text-align:center;margin-top:28px;border-top:1px solid #1e1e30;padding-top:20px;">
        TVA non applicable, art. 293 B du CGI · Mido Dev<br>
        Des questions ? Répondez directement à cet email.
      </p>
    </div>

    <p style="color:#333;font-size:11px;text-align:center;margin-top:16px;">© ${new Date().getFullYear()} Mido Dev</p>
  </div>
</body>
</html>
`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ message: 'Configuration Error: RESEND_API_KEY manquant.' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const { clientEmail, clientName, quoteNumber, total, depositAmount, validUntil, notes, pdfBase64 } = req.body;

        if (!clientEmail || !quoteNumber) {
            return res.status(400).json({ message: 'Champs requis manquants (clientEmail, quoteNumber).' });
        }

        const emailPayload = {
            from: 'Mido Dev <contact@midodev.fr>',
            to: [clientEmail],
            subject: `Votre devis ${quoteNumber} — Mido Dev`,
            html: emailTemplate({ clientName: clientName || 'Client', quoteNumber, total, depositAmount, validUntil, notes }),
        };

        if (pdfBase64) {
            emailPayload.attachments = [
                {
                    filename: `Devis_${quoteNumber}.pdf`,
                    content: pdfBase64,
                }
            ];
        }

        const data = await resend.emails.send(emailPayload);

        if (data.error) {
            return res.status(400).json({ message: 'Email non envoyé', error: data.error });
        }

        return res.status(200).json({ success: true, id: data.id });

    } catch (err) {
        console.error('[send-quote-email] Error:', err.message);
        return res.status(500).json({ message: `Server Error: ${err.message}` });
    }
}
