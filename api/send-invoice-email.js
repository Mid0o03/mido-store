/**
 * /api/send-invoice-email.js
 * Sends a branded email to the client with their deposit invoice PDF attached.
 * Expects: { clientEmail, clientName, invoiceNumber, amount, quoteNumber, pdfBase64 }
 */
import { Resend } from 'resend';

const BRAND_COLOR = '#39ff14';
const PORTAL_URL = 'https://www.midodev.fr/client';

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
        const { clientEmail, clientName, invoiceNumber, amount, quoteNumber, pdfBase64 } = req.body;

        if (!clientEmail || !invoiceNumber) {
            return res.status(400).json({ message: 'Paramètres manquants (clientEmail, invoiceNumber).' });
        }

        const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
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
          <span style="color:${BRAND_COLOR};font-size:12px;font-weight:700;letter-spacing:2px;">✓ PAYÉ</span>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="background:#13131f;border:1px solid #1e1e30;border-top:none;padding:36px;">
      <p style="color:#aaa;font-size:14px;margin:0 0 8px;">Bonjour <strong style="color:#fff;">${clientName || 'Client'}</strong>,</p>
      <p style="color:#888;font-size:14px;line-height:1.7;margin:0 0 28px;">
        Nous vous confirmons la bonne réception de votre acompte.<br>
        Votre <strong style="color:#fff;">facture ${invoiceNumber}</strong> correspondant au devis <strong style="color:#fff;">${quoteNumber || ''}</strong> est disponible en pièce jointe.
      </p>

      <!-- Amount Box -->
      <div style="background:#0a0a14;border:1px solid ${BRAND_COLOR};border-radius:10px;padding:24px;margin-bottom:28px;">
        <div style="color:#666;font-size:12px;letter-spacing:1px;margin-bottom:8px;">ACOMPTE REÇU</div>
        <div style="color:${BRAND_COLOR};font-size:28px;font-weight:900;font-family:monospace;">${parseFloat(amount || 0).toFixed(2)} €</div>
        <div style="color:#444;font-size:11px;margin-top:8px;">Le projet est officiellement lancé 🚀</div>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${PORTAL_URL}" style="background:${BRAND_COLOR};color:#000;font-weight:900;font-size:15px;text-decoration:none;padding:16px 36px;border-radius:8px;display:inline-block;letter-spacing:0.5px;">
          Accéder à mon espace client →
        </a>
        <p style="color:#555;font-size:12px;margin:14px 0 0;">Suivi de projet disponible sur <a href="${PORTAL_URL}" style="color:${BRAND_COLOR};">midodev.fr/client</a></p>
      </div>

      <!-- Legal -->
      <p style="color:#444;font-size:11px;text-align:center;margin-top:28px;border-top:1px solid #1e1e30;padding-top:20px;">
        Merci pour votre confiance — Maël · Mido Dev<br>
        TVA non applicable, art. 293 B du CGI
      </p>
    </div>

    <p style="color:#333;font-size:11px;text-align:center;margin-top:16px;">© ${new Date().getFullYear()} Mido Dev</p>
  </div>
</body>
</html>`;

        const emailPayload = {
            from: 'Mido Dev <contact@midodev.fr>',
            to: [clientEmail],
            subject: `Facture d'acompte ${invoiceNumber} — Mido Dev`,
            html: htmlBody,
        };

        if (pdfBase64) {
            emailPayload.attachments = [{
                filename: `Facture_${invoiceNumber}.pdf`,
                content: pdfBase64,
            }];
        }

        const data = await resend.emails.send(emailPayload);

        if (data.error) {
            return res.status(400).json({ message: 'Email non envoyé', error: data.error });
        }

        return res.status(200).json({ success: true, id: data.id });

    } catch (err) {
        console.error('[send-invoice-email] Error:', err.message);
        return res.status(500).json({ message: `Server Error: ${err.message}` });
    }
}
