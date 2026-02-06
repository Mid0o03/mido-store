import { Resend } from 'resend';

export default async function handler(req, res) {
    // 1. Validate Environment
    if (!process.env.RESEND_API_KEY) {
        console.error("Critical: RESEND_API_KEY is missing.");
        return res.status(500).json({ message: "Server Misconfiguration: Missing Email Key" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // 2. Validate Request
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { email, amount, items, date } = req.body;

        if (!email || !items) {
            return res.status(400).json({ message: "Missing required fields (email, items)" });
        }

        // 3. Construct Email HTML
        const itemsListHtml = items.map(item => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <strong>${item.title}</strong>
                <div style="color: #666; font-size: 12px;">Version: ${item.version || 'v1.0'}</div>
                <div style="float: right;">${item.price}</div>
            </div>
        `).join('');

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #333;">Merci pour votre commande ! 🎉</h2>
                <p>Bonjour,</p>
                <p>Votre achat sur <strong>Mido Store</strong> a bien été confirmé.</p>
                
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Récapitulatif</h3>
                    ${itemsListHtml}
                    <div style="border-top: 2px solid #333; margin-top: 10px; padding-top: 10px; text-align: right; font-weight: bold;">
                        Total: ${amount}€
                    </div>
                </div>

                <p>Vous pouvez télécharger vos fichiers à tout moment depuis votre <a href="https://www.midodev.fr/client" style="color: #0070f3;">Espace Client</a>.</p>
                
                <div style="font-size: 12px; color: #888; margin-top: 30px; text-align: center;">
                    Ceci est un email automatique. Merci de ne pas répondre directement.<br>
                    © 2024 Mido Dev.
                </div>
            </div>
        `;

        // 4. Send Email via Resend
        const data = await resend.emails.send({
            from: 'Mido Store <contact@midodev.fr>',
            to: [email],
            subject: `Votre Reçu de Commande Mido Store`,
            html: htmlContent,
        });

        if (data.error) {
            console.error("Resend API Error:", data.error);
            return res.status(400).json({ message: "Email delivery failed", error: data.error });
        }

        return res.status(200).json({ success: true, id: data.id });

    } catch (err) {
        console.error("Server Error:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
}
